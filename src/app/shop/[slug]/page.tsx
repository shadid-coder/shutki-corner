import { prisma } from '@/lib/prisma';
import { getReviewSummary } from '@/lib/queries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AddToCartForm from '@/components/AddToCartForm';
import StarRating from '@/components/StarRating';
import ReviewList from '@/components/ReviewList';
import ProductCard from '@/components/ProductCard';
import { listCatalogProducts } from '@/lib/queries';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: { reviewSort?: 'newest' | 'highest' | 'lowest' | 'verified' };
}

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { variants: true, category: true }
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return {};
  return {
    title: product.nameBn,
    description: product.shortDescBn,
    openGraph: { title: product.nameBn, description: product.shortDescBn, images: product.images }
  };
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const { avg, count } = await getReviewSummary(product.id);
  const related = (await listCatalogProducts({ categorySlug: product.category.slug })).filter((p) => p.slug !== product.slug).slice(0, 4);

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '8801XXXXXXXXX';
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/shop/${product.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameBn,
    image: product.images,
    description: product.shortDescBn,
    aggregateRating:
      count > 0
        ? { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: count }
        : undefined,
    offers: product.variants.map((v) => ({
      '@type': 'Offer',
      price: v.price.toString(),
      priceCurrency: 'BDT',
      availability: v.stockQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }))
  };

  return (
    <div className="bg-white min-h-screen">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container-app py-8 md:py-12">
        {/* ব্যাক টু শপ লিংক */}
        <Link href="/shop" className="inline-flex items-center text-sm font-medium text-navy-600 hover:text-sea-600 mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          সকল পণ্য দেখুন
        </Link>

        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          
          {/* বামদিক: ছবি গ্যালারি */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-beige-50 border border-beige-200 shadow-sm group">
              <Image 
                src={product.images[0] ?? '/placeholder-product.jpg'} 
                alt={product.nameBn} 
                fill 
                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" 
                priority
              />
              {product.variants.every(v => v.stockQty === 0) && (
                <span className="absolute left-4 top-4 rounded-full bg-red-500/90 px-4 py-1.5 text-sm font-medium text-white shadow-sm">
                  স্টকে নেই
                </span>
              )}
            </div>
            
            {/* থাম্বনেইল ছবি (যদি একাধিক ছবি থাকে) */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.slice(1).map((img, idx) => (
                  <div key={idx} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-beige-200 bg-beige-50 hover:border-sea-500 transition-colors cursor-pointer">
                    <Image src={img} alt={`${product.nameBn} - ${idx + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ডানদিক: পণ্যের তথ্য */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block rounded-full bg-sea-50 px-3 py-1 text-xs font-semibold text-sea-700">
                {product.category.nameBn}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-navy-950 md:text-4xl">{product.nameBn}</h1>
            
            <div className="mt-3 flex items-center gap-3">
              <StarRating value={avg} count={count} />
              <a href="#reviews" className="text-sm text-navy-600 hover:text-sea-600 hover:underline transition-colors">
                ({count} টি রিভিউ)
              </a>
            </div>

            <p className="mt-6 text-navy-800 leading-relaxed text-lg">{product.shortDescBn}</p>

            {/* কার্টে যোগ করার ফর্ম (এটাই মূল CTA) */}
            <div className="mt-8 p-6 bg-beige-50 rounded-2xl border border-beige-200">
              <AddToCartForm variants={product.variants.map((v) => ({ id: v.id, label: v.label, price: Number(v.price), stockQty: v.stockQty }))} />
            </div>

            {/* শেয়ার বাটন */}
            <div className="mt-6 flex items-center justify-between border-t border-beige-100 pt-6">
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`এই পণ্যটি দেখুন: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-sea-600 hover:text-sea-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22"/><path d="M2 11l9 9"/><path d="M11 13 2 22"/></svg>
                বন্ধুদের সাথে শেয়ার করুন
              </a>
              <span className="text-xs text-navy-500">আইডি: {product.slug}</span>
            </div>

            {/* অতিরিক্ত তথ্য (সংরক্ষণ, উৎস, ডেলিভারি) */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {product.storageInfoBn && (
                <div className="rounded-xl border border-beige-200 bg-white p-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-sea-50 text-sea-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-navy-900 mb-1">সংরক্ষণ</h3>
                  <p className="text-xs text-navy-600">{product.storageInfoBn}</p>
                </div>
              )}
              {product.originBn && (
                <div className="rounded-xl border border-beige-200 bg-white p-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-sea-50 text-sea-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-navy-900 mb-1">উৎস</h3>
                  <p className="text-xs text-navy-600">{product.originBn}</p>
                </div>
              )}
              <div className="rounded-xl border border-beige-200 bg-white p-4 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-sea-50 text-sea-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                </div>
                <h3 className="text-sm font-semibold text-navy-900 mb-1">ডেলিভারি</h3>
                <p className="text-xs text-navy-600">২-৪ কর্মদিবস</p>
              </div>
            </div>

            {/* বিস্তারিত বিবরণ */}
            <div className="mt-10 border-t border-beige-100 pt-6">
              <h2 className="text-xl font-bold text-navy-950 mb-4">পণ্যের বিস্তারিত</h2>
              <div className="prose prose-navy max-w-none text-navy-700 leading-relaxed whitespace-pre-line">
                {product.descriptionBn}
              </div>
            </div>
          </div>
        </div>

        {/* রিভিউ সেকশন */}
        <section id="reviews" className="mt-16 pt-10 border-t border-beige-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-bold text-navy-950">ক্রেতাদের রিভিউ</h2>
            <form method="get" className="flex items-center gap-2 text-sm">
              <label htmlFor="reviewSort" className="text-navy-700">সাজান:</label>
              <select id="reviewSort" name="reviewSort" defaultValue={searchParams.reviewSort ?? 'newest'} className="input-field w-auto py-1.5">
                <option value="newest">নতুন</option>
                <option value="highest">সর্বোচ্চ রেটিং</option>
                <option value="lowest">সর্বনিম্ন রেটিং</option>
                <option value="verified">যাচাইকৃত ক্রয় আগে</option>
              </select>
            </form>
          </div>
          <ReviewList productId={product.id} sort={searchParams.reviewSort} />
        </section>

        {/* সম্পর্কিত পণ্য */}
        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-beige-200">
            <h2 className="text-2xl font-bold text-navy-950 mb-6">সম্পর্কিত পণ্য</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}