import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatTaka } from '@/lib/format';

export default async function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true, address: true }
  });
  if (!order) notFound();

  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '+8801XXXXXXXXX';
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '8801XXXXXXXXX';

  return (
    <div className="container-app max-w-lg py-10 text-center">
      <div className="text-4xl">✅</div>
      <h1 className="mt-3 text-xl font-bold text-navy-950">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে</h1>
      <p className="mt-1 text-navy-700">অর্ডার আইডি: <span className="font-semibold">{order.orderNumber}</span></p>

      <div className="card mt-6 text-left">
        <h2 className="font-semibold text-navy-950">অর্ডার সামারি</h2>
        <ul className="mt-2 space-y-1 text-sm text-navy-800">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span>
                {i.productNameSnapshotBn} ({i.variantLabelSnapshot}) × {i.qty}
              </span>
              <span>{formatTaka(Number(i.unitPrice) * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-beige-200 pt-2 text-sm">
          <div className="flex justify-between">
            <span>সাবটোটাল</span>
            <span>{formatTaka(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span>ডেলিভারি চার্জ</span>
            <span>{formatTaka(Number(order.deliveryCharge))}</span>
          </div>
          <div className="flex justify-between font-semibold text-navy-950">
            <span>সর্বমোট</span>
            <span>{formatTaka(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-navy-700">
        ডেলিভারি ঠিকানা: {order.address.district}, {order.address.upazila}
        {order.address.landmark ? `, ${order.address.landmark}` : ''}
      </p>
      <p className="mt-1 text-sm text-navy-700">আনুমানিক ডেলিভারি: ২-৪ কর্মদিবস</p>

      <div className="mt-6 flex justify-center gap-3">
        <a href={`tel:${phone}`} className="btn-secondary">কল করুন</a>
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">হোয়াটসঅ্যাপ</a>
      </div>

      <Link href="/account/orders" className="btn-primary mt-4 inline-flex">
        আমার অর্ডার দেখুন
      </Link>
    </div>
  );
}
