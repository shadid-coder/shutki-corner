import { prisma } from '@/lib/prisma';
import { listCatalogProducts } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'সব পণ্য দেখুন',
  description: 'বিভিন্ন ধরনের শুঁটকি — লইট্টা, চিংড়ি, ছুরি, কাঁচকি এবং আরও অনেক কিছু।'
};

interface ShopPageProps {
  searchParams: {
    category?: string;
    q?: string;
    min?: string;
    max?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [categories, products] = await Promise.all([
    prisma.category.findMany(),
    listCatalogProducts({
      categorySlug: searchParams.category,
      search: searchParams.q,
      minPrice: searchParams.min ? Number(searchParams.min) : undefined,
      maxPrice: searchParams.max ? Number(searchParams.max) : undefined,
      sort: searchParams.sort
    })
  ]);

  return (
    <div className="container-app py-6">
      <h1 className="text-2xl font-bold text-navy-950">সব পণ্য</h1>

      <form method="get" className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="text-sm font-medium text-navy-800">
            খুঁজুন
          </label>
          <input
            id="q"
            name="q"
            defaultValue={searchParams.q}
            placeholder="যেমনঃ লইট্টা শুঁটকি"
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="category" className="text-sm font-medium text-navy-800">
            ক্যাটাগরি
          </label>
          <select id="category" name="category" defaultValue={searchParams.category} className="input-field mt-1">
            <option value="">সব ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.nameBn}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div>
            <label htmlFor="min" className="text-sm font-medium text-navy-800">
              সর্বনিম্ন দাম
            </label>
            <input id="min" name="min" type="number" defaultValue={searchParams.min} className="input-field mt-1 w-28" />
          </div>
          <div>
            <label htmlFor="max" className="text-sm font-medium text-navy-800">
              সর্বোচ্চ দাম
            </label>
            <input id="max" name="max" type="number" defaultValue={searchParams.max} className="input-field mt-1 w-28" />
          </div>
        </div>

        <div>
          <label htmlFor="sort" className="text-sm font-medium text-navy-800">
            সাজান
          </label>
          <select id="sort" name="sort" defaultValue={searchParams.sort ?? ''} className="input-field mt-1">
            <option value="">প্রাসঙ্গিকতা</option>
            <option value="newest">নতুন</option>
            <option value="popular">জনপ্রিয়তা</option>
            <option value="price_asc">দাম: কম থেকে বেশি</option>
            <option value="price_desc">দাম: বেশি থেকে কম</option>
          </select>
        </div>

        <button type="submit" className="btn-primary h-fit">
          ফিল্টার করুন
        </button>
      </form>

      {products.length === 0 ? (
        <p className="mt-10 text-center text-navy-700">কোনো পণ্য পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
