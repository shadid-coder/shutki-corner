import { prisma } from '@/lib/prisma';
import { updateProduct } from '../../actions';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: true }
  });
  const categories = await prisma.category.findMany();

  if (!product) notFound();

  const v250 = product.variants.find(v => v.label === '250g') || product.variants[0];
  const v500 = product.variants.find(v => v.label === '500g') || product.variants[1];

  async function submit(formData: FormData) {
    'use server';
    await updateProduct(product!.id, formData);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950">পণ্য এডিট করুন</h1>
      <form action={submit} className="mt-4 max-w-lg space-y-3">
        <select name="categoryId" defaultValue={product.categoryId} required className="input-field">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nameBn}</option>
          ))}
        </select>
        
        <input name="nameBn" defaultValue={product.nameBn} required className="input-field" />
        <input name="nameEn" defaultValue={product.nameEn} required className="input-field" />
        <input name="slug" defaultValue={product.slug} required className="input-field" />
        <input name="shortDescBn" defaultValue={product.shortDescBn} required className="input-field" />
        <textarea name="descriptionBn" defaultValue={product.descriptionBn} required rows={4} className="input-field" />
        
        <input name="storageInfoBn" defaultValue={product.storageInfoBn || ''} placeholder="সংরক্ষণ পদ্ধতি" className="input-field" />
        <input name="originBn" defaultValue={product.originBn || ''} placeholder="উৎস" className="input-field" />
        
        <input name="imageUrl" defaultValue={product.images[0] || ''} placeholder="ছবির URL" className="input-field" />

        <div className="grid grid-cols-2 gap-3">
          <input type="hidden" name="v250Id" value={v250?.id} />
          <input name="price250" type="number" step="0.01" defaultValue={v250?.price.toString()} required className="input-field" />
          <input name="stock250" type="number" defaultValue={v250?.stockQty} required className="input-field" />
          
          <input type="hidden" name="v500Id" value={v500?.id} />
          <input name="price500" type="number" step="0.01" defaultValue={v500?.price.toString()} required className="input-field" />
          <input name="stock500" type="number" defaultValue={v500?.stockQty} required className="input-field" />
        </div>

        <button type="submit" className="btn-primary w-full">আপডেট করুন</button>
      </form>
    </div>
  );
}