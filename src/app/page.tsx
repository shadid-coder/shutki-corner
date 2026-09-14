import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { listCatalogProducts, getPendingReviewRequestForUser } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import StarRating from '@/components/StarRating';
import ReviewRequestCard from '@/components/ReviewRequestCard';
import { anonymizeName } from '@/lib/anonymize';
import { getSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSession();

  const [categories, featured, recentReviews, pendingReviewRequest] = await Promise.all([
    prisma.category.findMany({ take: 7 }),
    listCatalogProducts({ sort: 'popular' }).then((p) => p.slice(0, 4)),
    prisma.review.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { user: true, product: true }
    }),
    session ? getPendingReviewRequestForUser(session.userId) : Promise.resolve(null)
  ]);

  return (
  <div>
    {pendingReviewRequest && (
      <ReviewRequestCard
        orderId={pendingReviewRequest.orderId}
        orderNumber={pendingReviewRequest.orderNumber}
        orderItemId={pendingReviewRequest.orderItemId}
      />
    )}

    {/* 🚀 Hero Section - আরও প্রিমিয়াম লুক */}
    <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
      <div className="container-app grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
            মানসম্মত শুঁটকি,
            <br />
            <span className="text-sea-400">যত্নসহকারে</span> আপনার ঘরে
          </h1>
          <p className="max-w-md text-lg text-beige-100/80">
            Quality dried fish, delivered with care. সারা বাংলাদেশে হোম ডেলিভারি।
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/shop" className="rounded-xl2 bg-sea-600 px-8 py-4 text-lg font-semibold shadow-lg shadow-sea-900/30 transition-all hover:-translate-y-1 hover:bg-sea-500">
              এখনই অর্ডার করুন
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl2 border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10 hover:border-white"
            >
              পণ্য দেখুন
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl">
          <Image
            src="/hero-shutki.jpg"
            alt="যত্নসহকারে প্যাকেটজাত শুঁটকি"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>

    {/* Categories - সুন্দর পিল ডিজাইন */}
    <section className="container-app py-12">
      <h2 className="text-2xl font-bold text-navy-950 mb-6">ক্যাটাগরি অনুযায়ী দেখুন</h2>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            className="whitespace-nowrap rounded-full border border-beige-300 bg-white px-6 py-3 text-sm font-medium text-navy-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sea-500 hover:shadow-md"
          >
            {c.nameBn}
          </Link>
        ))}
      </div>
    </section>

    {/* Featured products */}
    <section className="container-app py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy-950">জনপ্রিয় পণ্য</h2>
          <p className="text-sm text-navy-600 mt-1">আমাদের সবচেয়ে জনপ্রিয় শুঁটকিগুলো</p>
        </div>
        <Link href="/shop" className="text-sm font-semibold text-sea-600 hover:text-sea-700 flex items-center gap-1 group">
          সব দেখুন <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {featured.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>

    {/* Why choose us - আইকন ও কার্ড ডিজাইন */}
    <section className="bg-beige-50 py-16 mt-8">
      <div className="container-app">
        <h2 className="text-2xl font-bold text-navy-950 text-center mb-10">কেন শুঁটকি কর্নার</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: '🍱', title: 'হাইজেনিক প্যাকেজিং', desc: 'প্রতিটি পণ্য পরিষ্কার-পরিচ্ছন্নভাবে প্যাক করা হয়' },
            { icon: '🐟', title: 'মানসম্মত পণ্য', desc: 'সতর্কতার সাথে বাছাই করা শুঁটকি' },
            { icon: '🚚', title: 'নির্ভরযোগ্য ডেলিভারি', desc: 'সময়মতো পৌঁছে দেওয়ার চেষ্টা করি' }
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-beige-200 shadow-sm transition hover:shadow-md">
              <span className="text-4xl mb-4 bg-sea-50 p-3 rounded-full">{item.icon}</span>
              <h3 className="font-bold text-navy-950 text-lg">{item.title}</h3>
              <p className="mt-2 text-sm text-navy-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Delivery area - সুন্দর বক্স */}
    <section className="container-app py-12">
      <div className="rounded-2xl bg-gradient-to-r from-sea-50 to-beige-50 border border-sea-100 p-8 md:p-12 text-center md:text-left md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-950">সারা বাংলাদেশে ডেলিভারি</h2>
          <p className="mt-2 text-navy-700 max-w-2xl">আমরা সারা বাংলাদেশে ডেলিভারি করি। ডেলিভারি চার্জ এলাকাভেদে ভিন্ন হতে পারে।</p>
        </div>
        <Link href="/delivery-information" className="mt-6 md:mt-0 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-sea-700 shadow-sm border border-sea-200 hover:bg-sea-50 transition-colors">
          বিস্তারিত দেখুন
        </Link>
      </div>
    </section>

    {/* Reviews - রিভিউ কার্ড ডিজাইন */}
    <section className="container-app py-12 mb-12">
      <h2 className="text-2xl font-bold text-navy-950 mb-8">ক্রেতাদের মতামত</h2>
      {recentReviews.length === 0 ? (
        <div className="bg-beige-50 rounded-2xl p-8 text-center border border-beige-200">
          <p className="text-navy-700">এখনো কোনো রিভিউ নেই। আপনি প্রথম মতামত দিতে পারেন আপনার অর্ডার ডেলিভারি হওয়ার পর।</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-3">
          {recentReviews.map((r) => (
            <div key={r.id} className="relative rounded-2xl border border-beige-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <StarRating value={r.rating} />
              <p className="mt-4 text-sm text-navy-800 leading-relaxed">{r.bodyBn}</p>
              <div className="mt-6 pt-4 border-t border-beige-100 flex items-center justify-between text-xs text-navy-600">
                <span className="font-medium">{anonymizeName(r.user.name ?? 'ক্রেতা')}</span>
                <span>{r.product.nameBn}</span>
              </div>
              {r.isVerified && (
                <div className="mt-2 text-xs font-medium text-sea-600 flex items-center gap-1">
                  <span>✓</span> যাচাইকৃত ক্রয়
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  </div>
);
  
}
