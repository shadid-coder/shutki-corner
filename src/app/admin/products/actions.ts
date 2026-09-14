'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function toggleArchiveProduct(productId: string, archive: boolean) {
  const admin = await requireAdmin();
  const before = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const after = await prisma.product.update({ where: { id: productId }, data: { isArchived: archive } });

  await prisma.auditLog.create({
    data: {
      adminId: admin.userId,
      action: archive ? 'product:archive' : 'product:unarchive',
      entity: 'Product',
      entityId: productId,
      beforeJson: { isArchived: before.isArchived },
      afterJson: { isArchived: after.isArchived }
    }
  });

  revalidatePath('/admin/products');
}

export async function updateVariantStock(variantId: string, stockQty: number) {
  const admin = await requireAdmin();
  if (stockQty < 0) throw new Error('স্টক ঋণাত্মক হতে পারে না');

  const before = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  const after = await prisma.productVariant.update({ where: { id: variantId }, data: { stockQty } });

  await prisma.auditLog.create({
    data: {
      adminId: admin.userId,
      action: 'variant:stock_update',
      entity: 'ProductVariant',
      entityId: variantId,
      beforeJson: { stockQty: before.stockQty },
      afterJson: { stockQty: after.stockQty }
    }
  });

  revalidatePath('/admin/products');
}

export async function updateVariantPrice(variantId: string, price: number) {
  const admin = await requireAdmin();
  if (price <= 0) throw new Error('মূল্য অবশ্যই শূন্যের চেয়ে বেশি হতে হবে');

  const before = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  const after = await prisma.productVariant.update({ where: { id: variantId }, data: { price } });

  await prisma.auditLog.create({
    data: {
      adminId: admin.userId,
      action: 'variant:price_update',
      entity: 'ProductVariant',
      entityId: variantId,
      beforeJson: { price: before.price.toString() },
      afterJson: { price: after.price.toString() }
    }
  });

  revalidatePath('/admin/products');
}

interface NewVariantInput {
  label: string;
  weightGrams: number;
  price: number;
  stockQty: number;
  sku: string;
}

export async function createProduct(input: {
  categoryId: string;
  nameBn: string;
  nameEn: string;
  slug: string;
  shortDescBn: string;
  descriptionBn: string;
  images: string[];
  variants: NewVariantInput[];
}) {
  const admin = await requireAdmin();

  const product = await prisma.product.create({
    data: {
      categoryId: input.categoryId,
      nameBn: input.nameBn,
      nameEn: input.nameEn,
      slug: input.slug,
      shortDescBn: input.shortDescBn,
      descriptionBn: input.descriptionBn,
      images: input.images,
      variants: { create: input.variants }
    }
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.userId,
      action: 'product:create',
      entity: 'Product',
      entityId: product.id,
      beforeJson: undefined,
      afterJson: { nameBn: product.nameBn, slug: product.slug }
    }
  });

  revalidatePath('/admin/products');
  return product;
}
export async function updateProduct(productId: string, formData: FormData) {
  const nameBn = String(formData.get('nameBn'));
  const nameEn = String(formData.get('nameEn'));
  const slug = String(formData.get('slug'));
  const categoryId = String(formData.get('categoryId'));
  const shortDescBn = String(formData.get('shortDescBn'));
  const descriptionBn = String(formData.get('descriptionBn'));
  const storageInfoBn = String(formData.get('storageInfoBn') || '');
  const originBn = String(formData.get('originBn') || '');
  const imageUrl = String(formData.get('imageUrl') || '/placeholder-product.jpg');

  await prisma.product.update({
    where: { id: productId },
    data: {
      categoryId, nameBn, nameEn, slug, shortDescBn, descriptionBn, storageInfoBn, originBn, images: [imageUrl]
    }
  });

  const v250Id = String(formData.get('v250Id'));
  const v500Id = String(formData.get('v500Id'));

  if (v250Id) {
    await prisma.productVariant.update({
      where: { id: v250Id },
      data: {
        price: Number(formData.get('price250')),
        stockQty: Number(formData.get('stock250')),
        sku: `${slug}-250g`
      }
    });
  }

  if (v500Id) {
    await prisma.productVariant.update({
      where: { id: v500Id },
      data: {
        price: Number(formData.get('price500')),
        stockQty: Number(formData.get('stock500')),
        sku: `${slug}-500g`
      }
    });
  }
const v1kgId = String(formData.get('v1kgId'));

if (v1kgId && v1kgId !== 'undefined' && v1kgId !== 'null') {
  await prisma.productVariant.update({
    where: { id: v1kgId },
    data: {
      price: Number(formData.get('price1kg')),
      stockQty: Number(formData.get('stock1kg')),
      sku: `${slug}-1kg`
    }
  });
}
  revalidatePath('/admin/products');
  redirect('/admin/products');
}