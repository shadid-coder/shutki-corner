import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
  const products = await prisma.product.findMany({ where: { isArchived: false }, select: { slug: true, updatedAt: true } });

  const staticPages = [
    '',
    '/shop',
    '/about',
    '/delivery-information',
    '/contact',
    '/faq',
    '/privacy-policy',
    '/terms-and-conditions'
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  const productPages = products.map((p) => ({ url: `${base}/shop/${p.slug}`, lastModified: p.updatedAt }));

  return [...staticPages, ...productPages];
}
