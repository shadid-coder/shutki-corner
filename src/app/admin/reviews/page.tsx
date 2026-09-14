import { prisma } from '@/lib/prisma';
import StarRating from '@/components/StarRating';
import { approveReview, rejectReview, hideReview, restoreReview, resolveReport } from './actions';

export default async function AdminReviewsPage() {
  const [pending, reported, recentApproved, hidden] = await Promise.all([
    prisma.review.findMany({ where: { status: 'PENDING', deletedAt: null }, include: { user: true, product: true }, orderBy: { createdAt: 'asc' } }),
    prisma.reviewReport.findMany({
      where: { status: 'OPEN', review: { deletedAt: null } },
      include: { review: { include: { user: true, product: true } }, reporter: true }
    }),
    prisma.review.findMany({ where: { status: 'APPROVED', deletedAt: null }, include: { user: true, product: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.review.findMany({ where: { status: 'HIDDEN', deletedAt: null }, include: { user: true, product: true }, orderBy: { createdAt: 'desc' }, take: 20 })
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-navy-950">রিভিউ মডারেশন</h1>
        <p className="mt-1 text-sm text-navy-700">
          নেতিবাচক রিভিউ শুধুমাত্র স্প্যাম/আপত্তিকর/অপ্রাসঙ্গিক হলে লুকানো হবে — মতামত অপছন্দ হওয়ার কারণে নয়।
        </p>
      </div>

      <section>
        <h2 className="font-semibold text-navy-950">অনুমোদনের অপেক্ষায় ({pending.length})</h2>
        <div className="mt-3 space-y-3">
          {pending.length === 0 && <p className="text-sm text-navy-700">কোনো রিভিউ অপেক্ষমাণ নেই</p>}
          {pending.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} />
                <span className="text-xs text-navy-700">{r.product.nameBn}</span>
              </div>
              <p className="mt-2 text-navy-800">{r.bodyBn}</p>
              <p className="mt-1 text-xs text-navy-700">{r.user.name ?? r.user.phone}</p>
              <div className="mt-3 flex gap-2">
                <form action={async () => { 'use server'; await approveReview(r.id); }}>
                  <button className="rounded-lg bg-sea-500 px-3 py-1.5 text-xs font-medium text-white">অনুমোদন করুন</button>
                </form>
                <form
                  action={async (formData: FormData) => {
                    'use server';
                    await rejectReview(r.id, String(formData.get('reason')));
                  }}
                  className="flex items-center gap-1"
                >
                  <input name="reason" placeholder="বাতিলের কারণ" required className="input-field w-40 py-1 text-xs" />
                  <button className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600">বাতিল করুন</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-navy-950">রিপোর্ট করা রিভিউ ({reported.length})</h2>
        <div className="mt-3 space-y-3">
          {reported.length === 0 && <p className="text-sm text-navy-700">কোনো খোলা রিপোর্ট নেই</p>}
          {reported.map((rep) => (
            <div key={rep.id} className="card">
              <p className="text-sm text-navy-800">
                <span className="font-medium">{rep.reason}</span> — {rep.review.product.nameBn}
              </p>
              <p className="mt-1 text-navy-800">{rep.review.bodyBn}</p>
              {rep.note && <p className="mt-1 text-xs text-navy-700">রিপোর্টের নোট: {rep.note}</p>}
              <div className="mt-3 flex gap-2">
                <form
                  action={async (formData: FormData) => {
                    'use server';
                    await hideReview(rep.review.id, String(formData.get('reason')));
                    await resolveReport(rep.id, 'ACTIONED');
                  }}
                  className="flex items-center gap-1"
                >
                  <input name="reason" placeholder="লুকানোর কারণ" required className="input-field w-40 py-1 text-xs" />
                  <button className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600">লুকান</button>
                </form>
                <form action={async () => { 'use server'; await resolveReport(rep.id, 'DISMISSED'); }}>
                  <button className="rounded-lg bg-beige-200 px-3 py-1.5 text-xs font-medium text-navy-800">খারিজ করুন</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-navy-950">সাম্প্রতিক অনুমোদিত রিভিউ</h2>
        <div className="mt-3 space-y-3">
          {recentApproved.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} />
                <span className="text-xs text-navy-700">{r.product.nameBn}</span>
              </div>
              <p className="mt-2 text-navy-800">{r.bodyBn}</p>
              <form action={async (formData: FormData) => { 'use server'; await hideReview(r.id, String(formData.get('reason'))); }} className="mt-2 flex items-center gap-1">
                <input name="reason" placeholder="লুকানোর কারণ" required className="input-field w-40 py-1 text-xs" />
                <button className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600">লুকান</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-navy-950">লুকানো রিভিউ</h2>
        <div className="mt-3 space-y-3">
          {hidden.length === 0 && <p className="text-sm text-navy-700">কোনো লুকানো রিভিউ নেই</p>}
          {hidden.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} />
                <span className="text-xs text-navy-700">{r.product.nameBn}</span>
              </div>
              <p className="mt-2 text-navy-800">{r.bodyBn}</p>
              <form action={async () => { 'use server'; await restoreReview(r.id); }} className="mt-2">
                <button className="rounded-lg bg-sea-100 px-3 py-1.5 text-xs font-medium text-sea-600">পুনরুদ্ধার করুন</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
