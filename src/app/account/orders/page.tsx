import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatTaka } from '@/lib/format';
import { canEditOwnReview } from '@/lib/review-eligibility';

const STATUS_LABEL_BN: Record<string, string> = {
  PENDING: 'অপেক্ষমাণ',
  CONFIRMED: 'নিশ্চিত হয়েছে',
  PROCESSING: 'প্রস্তুত হচ্ছে',
  PACKED: 'প্যাক করা হয়েছে',
  SHIPPED: 'পাঠানো হয়েছে',
  DELIVERED: 'ডেলিভার হয়েছে',
  CANCELLED: 'বাতিল হয়েছে'
};

// স্ট্যাটাস অনুযায়ী রঙ নির্ধারণ
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PACKED: 'bg-purple-100 text-purple-800 border-purple-200',
  SHIPPED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
};

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect('/account/login');

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { review: true } } }
  });

  if (orders.length === 0) {
    return (
      <div className="container-app py-24 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-beige-100 text-5xl mb-6">
          📦
        </div>
        <h2 className="text-2xl font-bold text-navy-950">আপনার এখনো কোনো অর্ডার নেই</h2>
        <p className="text-navy-600 mt-2">কেনাকাটা শুরু করতে নিচের বাটনে ক্লিক করুন।</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex px-8 py-3">
          কেনাকাটা শুরু করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app max-w-4xl py-10 min-h-[70vh]">
      <div className="flex items-center gap-4 mb-8">
         <Link href="/account" className="text-navy-500 hover:text-navy-800 transition-colors bg-white p-2 rounded-full border border-beige-200 shadow-sm">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
         </Link>
         <h1 className="text-3xl font-bold text-navy-950">আমার অর্ডার</h1>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-beige-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
            
            {/* অর্ডার হেডার */}
            <div className="bg-beige-50 px-6 py-4 border-b border-beige-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                 <span className="font-semibold text-navy-950 text-lg">{order.orderNumber}</span>
                 <p className="text-sm text-navy-600 mt-0.5">
                   {new Date(order.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                 </p>
              </div>
              <span className={`rounded-full px-4 py-1.5 text-xs font-semibold border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {STATUS_LABEL_BN[order.status]}
              </span>
            </div>

            {/* অর্ডারের পণ্যসমূহ */}
            <div className="p-6 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-beige-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-navy-950">{item.productNameSnapshotBn}</p>
                    <p className="text-sm text-navy-600 mt-1">
                      সাইজ: <span className="font-medium text-navy-800">{item.variantLabelSnapshot}</span> | পরিমাণ: <span className="font-medium text-navy-800">{item.qty}</span>
                    </p>
                  </div>
                  
                  {/* রিভিউ সেকশন */}
                  <div className="flex items-center">
                    {order.status === 'DELIVERED' && (
                      item.review ? (
                        item.review.deletedAt ? (
                          <span className="text-xs text-navy-500 bg-beige-100 px-3 py-1 rounded-full">রিভিউ মুছে ফেলা হয়েছে</span>
                        ) : (
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-green-700 bg-green-50 px-3 py-1.5 rounded-full flex items-center gap-1 font-medium">
                              <span>✓</span> রিভিউ দেওয়া হয়েছে
                            </span>
                            {canEditOwnReview({
                              reviewOwnerId: item.review.userId,
                              requesterId: session.userId,
                              createdAt: item.review.createdAt,
                              deletedAt: item.review.deletedAt
                            }).allowed && (
                              <Link href={`/reviews/${item.review.id}/edit`} className="font-medium text-sea-600 hover:text-sea-700 underline">
                                সম্পাদনা করুন
                              </Link>
                            )}
                          </div>
                        )
                      ) : (
                        <Link href={`/reviews/new?orderItemId=${item.id}`} className="rounded-lg bg-sea-50 px-4 py-2 text-xs font-semibold text-sea-600 hover:bg-sea-100 hover:text-sea-700 transition-colors border border-sea-200">
                          রিভিউ দিন
                        </Link>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* অর্ডার ফুটার (টোটাল) */}
            <div className="bg-white px-6 py-4 border-t border-beige-100 flex items-center justify-between">
               <span className="text-sm text-navy-600">সর্বমোট</span>
               <span className="text-xl font-bold text-navy-950">{formatTaka(Number(order.total))}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}