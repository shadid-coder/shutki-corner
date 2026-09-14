import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCartWithItems, getOrCreateCart } from '@/lib/cart';

const addSchema = z.object({ variantId: z.string().min(1), qty: z.number().int().positive().max(50) });
const updateSchema = z.object({ itemId: z.string().min(1), qty: z.number().int().min(0).max(50) });

export async function GET() {
  const cart = await getCartWithItems();
  return NextResponse.json(cart);
}

export async function POST(req: NextRequest) {
  const parsed = addSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'অনুরোধ সঠিক নয়' }, { status: 400 });
  }
  const { variantId, qty } = parsed.data;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি' }, { status: 404 });
  if (variant.stockQty <= 0) return NextResponse.json({ error: 'এই পণ্যটি বর্তমানে স্টকে নেই' }, { status: 409 });

  const cart = await getOrCreateCart();
  const existingItem = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const newQty = Math.min((existingItem?.qty ?? 0) + qty, variant.stockQty);

  const item = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { qty: newQty },
    create: { cartId: cart.id, variantId, qty: newQty }
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'অনুরোধ সঠিক নয়' }, { status: 400 });
  const { itemId, qty } = parsed.data;

  if (qty === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ deleted: true });
  }

  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { variant: true } });
  if (!item) return NextResponse.json({ error: 'আইটেম পাওয়া যায়নি' }, { status: 404 });

  const clampedQty = Math.min(qty, item.variant.stockQty);
  const updated = await prisma.cartItem.update({ where: { id: itemId }, data: { qty: clampedQty } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: 'itemId আবশ্যক' }, { status: 400 });
  await prisma.cartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ deleted: true });
}
