import { prisma } from '@/lib/prisma';
import { formatTaka } from '@/lib/format';
import Link from 'next/link';

export default async function AdminOverviewPage() {
  const [orderCount, totalSalesAgg, lowStock, pendingReviews, openReports] = await Promise.all([
    prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true } }),
    prisma.productVariant.findMany({ where: { stockQty: { lte: 5 } }, include: { product: true }, take: 10 }),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.reviewReport.count({ where: { status: 'OPEN' } })
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">ওভারভিউ</h1>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-navy-700">মোট অর্ডার</p>
          <p className="text-2xl font-bold text-navy-950">{orderCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-navy-700">মোট বিক্রয়</p>
          <p className="text-2xl font-bold text-navy-950">{formatTaka(Number(totalSalesAgg._sum.total ?? 0))}</p>
        </div>
        <div className="card">
          <p className="text-sm text-navy-700">মডারেশনের অপেক্ষায়</p>
          <p className="text-2xl font-bold text-navy-950">{pendingReviews}</p>
          <p className="text-xs text-navy-700">রিপোর্ট করা: {openReports}</p>
          <Link href="/admin/reviews" className="text-xs text-sea-600 underline">
            দেখুন →
          </Link>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-navy-950">কম স্টক পণ্য</h2>
        {lowStock.length === 0 ? (
          <p className="mt-2 text-sm text-navy-700">সব পণ্যের স্টক পর্যাপ্ত আছে</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {lowStock.map((v) => (
              <li key={v.id} className="flex justify-between">
                <span>
                  {v.product.nameBn} ({v.label})
                </span>
                <span className="font-medium text-red-600">{v.stockQty} বাকি</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
