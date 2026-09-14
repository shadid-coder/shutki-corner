import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { checkoutSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { getSession, createSession } from '@/lib/auth';
import { validateStock, InsufficientStockError } from '@/lib/stock';
import { calcSubtotal, calcTotal } from '@/lib/pricing';
import { getDeliveryCharge } from '@/lib/delivery-charge';
import { generateOrderNumber } from '@/lib/order-number';
import { getPaymentProvider } from '@/lib/payments/provider';
import { rateLimit } from '@/lib/rate-limit';
import { resolveCheckoutIdentity } from '@/lib/checkout-identity';
import { createOrderIdempotently } from '@/lib/idempotent-order';

function isUniqueConstraintError(err: unknown, target: string): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002' &&
    // `meta.target` is the column/constraint name(s) that were violated —
    // check it explicitly so we never swallow an unrelated unique-key
    // violation (e.g. a SKU clash) as if it were a duplicate order.
    Array.isArray(err.meta?.target) &&
    (err.meta!.target as string[]).includes(target)
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const limit = await rateLimit(`checkout:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'অনুরোধ অনেক বেশি, একটু পর আবার চেষ্টা করুন' }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'ফর্মটি সঠিকভাবে পূরণ করুন', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Fast-path idempotency check — not the authoritative guard (see
  // createOrderIdempotently below), just avoids unnecessary work for the
  // common "same key submitted again well after the first order exists"
  // case.
  const dup = await prisma.order.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
  if (dup) {
    return NextResponse.json({ orderId: dup.id, orderNumber: dup.orderNumber }, { status: 200 });
  }

  // --- Resolve identity explicitly (see src/lib/checkout-identity.ts) ---
  const session = await getSession();
  const existingUserForFormPhone = session ? null : await prisma.user.findUnique({ where: { phone: data.phone } });
  const identity = resolveCheckoutIdentity({
    session: session ? { userId: session.userId, phone: session.phone } : null,
    formPhone: data.phone,
    formName: data.name,
    existingUserForFormPhone: existingUserForFormPhone ? { id: existingUserForFormPhone.id } : null
  });

  if (identity.kind === 'reject_mismatch' || identity.kind === 'reject_existing_account') {
    return NextResponse.json(
      { error: identity.reasonBn, requiresLogin: identity.kind === 'reject_existing_account' },
      { status: 409 }
    );
  }

  let userId: string;
  if (identity.kind === 'use_session') {
    userId = identity.userId;
  } else {
    const user = await prisma.user.create({ data: { phone: identity.phone, name: identity.name } });
    userId = user.id;
    await createSession({ userId: user.id, phone: user.phone, role: 'CUSTOMER' });
  }

  const address = await prisma.address.create({
    data: { userId, district: data.district, upazila: data.upazila, landmark: data.landmark }
  });

  // Fast, friendly pre-check — not authoritative (see comment in stock.ts).
  const variantIds = data.items.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } }, include: { product: true } });
  const stockResults = validateStock(
    data.items.map((i) => {
      const v = variants.find((vv) => vv.id === i.variantId);
      return { variantId: i.variantId, requestedQty: i.qty, availableQty: v?.stockQty ?? 0 };
    })
  );
  const failed = stockResults.filter((r) => !r.ok);
  if (failed.length > 0) {
    return NextResponse.json({ error: 'কিছু পণ্যের স্টক পর্যাপ্ত নয়', details: failed }, { status: 409 });
  }

  const lines = data.items.map((i) => {
    const v = variants.find((vv) => vv.id === i.variantId)!;
    return { unitPrice: Number(v.price), qty: i.qty };
  });
  const subtotal = calcSubtotal(lines);
  const deliveryCharge = await getDeliveryCharge(data.district, data.upazila);
  const total = calcTotal(subtotal, deliveryCharge);

  let result: { order: { id: string; orderNumber: string }; wasDuplicate: boolean };
  try {
    result = await createOrderIdempotently(
      data.idempotencyKey,
      {
        findByKey: (key) => prisma.order.findUnique({ where: { idempotencyKey: key } }),
        createOrder: () =>
          prisma.$transaction(async (tx) => {
            const created = await tx.order.create({
              data: {
                orderNumber: generateOrderNumber(),
                userId,
                addressId: address.id,
                status: 'PENDING',
                subtotal,
                deliveryCharge,
                total,
                deliveryNote: data.deliveryNote,
                contactMethod: data.contactMethod,
                paymentMethod: data.paymentMethod,
                trxId: data.trxId || null,
                senderPhone: data.senderPhone || null,
                idempotencyKey: data.idempotencyKey,
                items: {
                  create: data.items.map((i) => {
                    const v = variants.find((vv) => vv.id === i.variantId)!;
                    return {
                      variantId: v.id,
                      productNameSnapshotBn: v.product.nameBn,
                      variantLabelSnapshot: v.label,
                      unitPrice: v.price,
                      qty: i.qty
                    };
                  })
                }
              }
            });

            // Concurrency-safe stock decrement: the WHERE clause is
            // evaluated against the row's current value at write time,
            // atomically, by Postgres — so two concurrent checkouts for
            // the last unit can never both succeed. `updateMany` (not
            // `update`) is used deliberately: it lets us match on
            // `stockQty: { gte: qty }` and inspect `count` to detect a
            // failed guard, instead of unconditionally decrementing and
            // finding out too late.
            for (const i of data.items) {
              const decremented = await tx.productVariant.updateMany({
                where: { id: i.variantId, stockQty: { gte: i.qty } },
                data: { stockQty: { decrement: i.qty } }
              });
              if (decremented.count === 0) {
                throw new InsufficientStockError(i.variantId);
              }
            }

            const cart = await tx.cart.findFirst({ where: { userId } });
            if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

            return created;
          })
      },
      (err) => isUniqueConstraintError(err, 'Order_idempotencyKey_key') || isUniqueConstraintError(err, 'idempotencyKey')
    );
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      // The transaction rolled back automatically — no order, no
      // address left dangling in a half-placed state, no partial stock
      // decrement — because throwing inside `$transaction`'s callback
      // rolls back everything done within it.
      return NextResponse.json(
        { error: 'দুঃখিত, এই মুহূর্তে অন্য একটি অর্ডারের কারণে পর্যাপ্ত স্টক নেই। আবার চেষ্টা করুন।' },
        { status: 409 }
      );
    }
    throw err;
  }

  const order = result.order;

  if (result.wasDuplicate) {
    // Another concurrent request already created this order — return it
    // as-is without re-initiating payment/notifications a second time.
    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber }, { status: 200 });
  }

  const provider = getPaymentProvider(data.paymentMethod);
  const paymentInit = await provider.init(order.id, total);
  await prisma.payment.create({ data: { orderId: order.id, method: data.paymentMethod, status: 'PENDING' } });

  await prisma.notification.create({
    data: { userId, type: 'ORDER_CONFIRMED', payload: { orderNumber: order.orderNumber } }
  });

  return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, paymentInit }, { status: 201 });
}
