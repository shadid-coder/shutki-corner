import { prisma } from '@/lib/prisma';
import { formatTaka } from '@/lib/format';
import { updateOrderStatus } from './actions';
import type { OrderStatus } from '@prisma/client';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_LABEL_BN: Record<OrderStatus, string> = {
  PENDING: 'অপেক্ষমাণ',
  CONFIRMED: 'নিশ্চিত',
  PROCESSING: 'প্রস্তুত হচ্ছে',
  PACKED: 'প্যাক করা হয়েছে',
  SHIPPED: 'পাঠানো হয়েছে',
  DELIVERED: 'ডেলিভার হয়েছে',
  CANCELLED: 'বাতিল'
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true, address: true, items: true },
    take: 100
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-950">অর্ডার পরিচালনা</h1>
        <a href="/api/admin/orders/export" className="btn-secondary">
          CSV এক্সপোর্ট
        </a>
      </div>

      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-navy-950">{order.orderNumber}</p>
                <p className="text-xs text-navy-700">
                  {order.user.name ?? order.user.phone} · {order.address.district}, {order.address.upazila}
                </p>
              </div>
              <form
                action={async (formData: FormData) => {
                  'use server';
                  await updateOrderStatus(order.id, formData.get('status') as OrderStatus);
                }}
                className="flex items-center gap-2"
              >
                <select name="status" defaultValue={order.status} className="input-field w-auto py-1.5 text-sm">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL_BN[s]}
                    </option>
                  ))}
                </select>
                <button className="btn-secondary py-1.5 text-sm">হালনাগাদ</button>
              </form>
            </div>
            
            <p className="mt-2 text-sm text-navy-800">{order.items.length}টি পণ্য · {formatTaka(Number(order.total))}</p>
            
            
            {order.paymentMethod !== 'COD' && (
              <div className="mt-3 text-xs bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 shadow-sm">
                <p className="font-semibold mb-1">
                  পেমেন্ট মাধ্যম: {order.paymentMethod === 'MANUAL_BKASH' ? 'বিকাশ' : 'নগদ'}
                </p>
                {order.senderPhone && (
                  <p><span className="font-medium">প্রেরকের নাম্বার:</span> {order.senderPhone}</p>
                )}
                {order.trxId && (
                  <p><span className="font-medium">ট্রানজেকশন আইডি (TrxID):</span> {order.trxId}</p>
                )}
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}