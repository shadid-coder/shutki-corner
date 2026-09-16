import { prisma } from '@/lib/prisma';
import { createProduct } from '../actions';
import { redirect } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';


export default async function NewProductPage() {
  const categories = await prisma.category.findMany();

  async function submit(formData: FormData) {
    'use server';
    const nameBn = String(formData.get('nameBn'));
    const slug = String(formData.get('slug'));

    await createProduct({
      categoryId: String(formData.get('categoryId')),
      nameBn,
      nameEn: String(formData.get('nameEn')),
      slug,
      shortDescBn: String(formData.get('shortDescBn')),
      descriptionBn: String(formData.get('descriptionBn')),
      images: [String(formData.get('imageUrl') || '/placeholder-product.jpg')],
      variants: [
        {
          label: '250g',
          weightGrams: 250,
          price: Number(formData.get('price250')),
          stockQty: Number(formData.get('stock250')),
          sku: `${slug}-250g`
        },
        {
          label: '500g',
          weightGrams: 500,
          price: Number(formData.get('price500')),
          stockQty: Number(formData.get('stock500')),
          sku: `${slug}-500g`
        }
      ]
    });

    redirect('/admin/products');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">নতুন পণ্য যোগ করুন</h1>
      <form action={submit} className="mt-4 max-w-lg space-y-3">
        <select name="categoryId" required className="input-field">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameBn}
            </option>
          ))}
        </select>
        <input name="nameBn" required placeholder="পণ্যের নাম (বাংলা)" className="input-field" />
        <input name="nameEn" required placeholder="Product name (English)" className="input-field" />
        <input name="slug" required placeholder="slug (e.g. loitta-shutki)" className="input-field" />
        <input name="shortDescBn" required placeholder="সংক্ষিপ্ত বিবরণ" className="input-field" />
        <textarea name="descriptionBn" required placeholder="বিস্তারিত বিবরণ" rows={4} className="input-field" />
        <input name="storageInfoBn" placeholder="সংরক্ষণ পদ্ধতি" className="input-field" />
<input name="originBn" placeholder="উৎস" className="input-field" />
       <ImageUpload />

        <div className="grid grid-cols-2 gap-3">
          <input name="price250" type="number" step="0.01" required placeholder="250g মূল্য" className="input-field" />
          <input name="stock250" type="number" required placeholder="250g স্টক" className="input-field" />
          <input name="price500" type="number" step="0.01" required placeholder="500g মূল্য" className="input-field" />
          <input name="stock500" type="number" required placeholder="500g স্টক" className="input-field" />
          <input name="price1kg" type="number" step="0.01" placeholder="1kg মূল্য" className="input-field" />
          <input name="stock1kg" type="number" placeholder="1kg স্টক" className="input-field" />
        </div>

        <button type="submit" className="btn-primary w-full">
          পণ্য যোগ করুন
        </button>
      </form>
    </div>
  );
}
