import { prisma } from '@/lib/prisma';
import { formatTaka } from '@/lib/format';
import { toggleArchiveProduct, updateVariantStock, updateVariantPrice } from './actions';
import Link from 'next/link';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { variants: true, category: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-950">পণ্য পরিচালনা</h1>
        <Link href="/admin/products/new" className="btn-primary">
          নতুন পণ্য যোগ করুন
        </Link>
      </div>

      <div className="mt-4 space-y-4">
        {products.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy-950">
                  {p.nameBn} {p.isDemo && <span className="text-xs text-amber-600">(ডেমো)</span>}
                </p>
                <p className="text-xs text-navy-700">{p.category.nameBn}</p>
              </div>
              <form
                action={async () => {
                  'use server';
                  await toggleArchiveProduct(p.id, !p.isArchived);
                }}
              >

                <Link href={`/admin/products/${p.id}/edit`} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
  এডিট করুন
</Link>
                <button className={`rounded-lg px-3 py-1.5 text-xs font-medium ${p.isArchived ? 'bg-sea-100 text-sea-600' : 'bg-red-100 text-red-600'}`}>
                  {p.isArchived ? 'সক্রিয় করুন' : 'আর্কাইভ করুন'}
                </button>
              </form>
            </div>

            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-navy-700">
                  <th className="py-1">সাইজ</th>
                  <th className="py-1">মূল্য</th>
                  <th className="py-1">স্টক</th>
                </tr>
              </thead>
              <tbody>
                {p.variants.map((v) => (
                  <tr key={v.id} className="border-t border-beige-100">
                    <td className="py-1.5">{v.label}</td>
                    <td className="py-1.5">
                      <form
                        action={async (formData: FormData) => {
                          'use server';
                          await updateVariantPrice(v.id, Number(formData.get('price')));
                        }}
                        className="flex items-center gap-1"
                      >
                        <input name="price" type="number" step="0.01" defaultValue={v.price.toString()} className="input-field w-24 py-1" />
                        <button className="text-xs text-sea-600 underline">সংরক্ষণ</button>
                      </form>
                    </td>
                    <td className="py-1.5">
                      <form
                        action={async (formData: FormData) => {
                          'use server';
                          await updateVariantStock(v.id, Number(formData.get('stockQty')));
                        }}
                        className="flex items-center gap-1"
                      >
                        <input name="stockQty" type="number" defaultValue={v.stockQty} className="input-field w-20 py-1" />
                        <button className="text-xs text-sea-600 underline">সংরক্ষণ</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-navy-700">সর্বোচ্চ প্রদর্শিত মূল্য: {formatTaka(Math.max(...p.variants.map((v) => Number(v.price))))}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
