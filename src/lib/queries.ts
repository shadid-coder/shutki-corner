import { prisma } from './prisma';
import type { ProductCardData } from '@/components/ProductCard';

export async function getProductCardData(productId: string): Promise<Pick<ProductCardData, 'minPrice' | 'inStock'>> {
  const variants = await prisma.productVariant.findMany({ where: { productId } });
  const minPrice = variants.length ? Math.min(...variants.map((v) => Number(v.price))) : 0;
  const inStock = variants.some((v) => v.stockQty > 0);
  return { minPrice, inStock };
}

export async function getReviewSummary(productId: string): Promise<{ avg: number; count: number }> {
  const agg = await prisma.review.aggregate({
    where: { productId, status: 'APPROVED', deletedAt: null },
    _avg: { rating: true },
    _count: { rating: true }
  });
  return { avg: agg._avg.rating ?? 0, count: agg._count.rating };
}

export async function listCatalogProducts(params: {  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}) {
  const products = await prisma.product.findMany({
    where: {
      isArchived: false,
      category: params.categorySlug ? { slug: params.categorySlug } : undefined,
      OR: params.search
        ? [
            { nameBn: { contains: params.search, mode: 'insensitive' } },
            { nameEn: { contains: params.search, mode: 'insensitive' } }
          ]
        : undefined
    },
    include: { variants: true, _count: { select: { reviews: true } } },
    orderBy: params.sort === 'newest' ? { createdAt: 'desc' } : undefined
  });

  const withSummary = await Promise.all(
    products.map(async (p) => {
      const { avg, count } = await getReviewSummary(p.id);
      const prices = p.variants.map((v) => Number(v.price));
      const minPrice = prices.length ? Math.min(...prices) : 0;
      return {
        slug: p.slug,
        nameBn: p.nameBn,
        shortDescBn: p.shortDescBn,
        image: p.images[0] ?? '/placeholder-product.jpg',
        minPrice,
        inStock: p.variants.some((v) => v.stockQty > 0),
        avgRating: avg,
        reviewCount: count
      };
    })
  );

  let filtered = withSummary;
  if (typeof params.minPrice === 'number') filtered = filtered.filter((p) => p.minPrice >= params.minPrice!);
  if (typeof params.maxPrice === 'number') filtered = filtered.filter((p) => p.minPrice <= params.maxPrice!);

  if (params.sort === 'price_asc') filtered = [...filtered].sort((a, b) => a.minPrice - b.minPrice);
  if (params.sort === 'price_desc') filtered = [...filtered].sort((a, b) => b.minPrice - a.minPrice);
  if (params.sort === 'popular') filtered = [...filtered].sort((a, b) => b.reviewCount - a.reviewCount);

  return filtered;
}

export interface PendingReviewRequest {
  orderId: string;
  orderNumber: string;
  /** First unreviewed item's id, so the CTA can link straight to it. */
  orderItemId: string;
}

/** Finds the most recent delivered order for this user that still has an
 * unreviewed (or deleted-review) item and hasn't been dismissed — used
 * to show the home page's review-request card for logged-in eligible
 * customers only. Deliberately independent of reminder *timing*
 * (see src/lib/review-reminders.ts) — this is a passive, always-visible
 * nudge, not a scheduled push notification. */
export async function getPendingReviewRequestForUser(userId: string): Promise<PendingReviewRequest | null> {
  const dismissed = await prisma.notification.findMany({
    where: { userId, type: 'REVIEW_REMINDER_DISMISSED' },
    select: { payload: true }
  });
  const dismissedOrderIds = new Set(
    dismissed.map((n) => (n.payload as { orderId?: string } | null)?.orderId).filter((id): id is string => Boolean(id))
  );

  const orders = await prisma.order.findMany({
    where: { userId, status: 'DELIVERED' },
    orderBy: { deliveredAt: 'desc' },
    include: { items: { include: { review: true } } },
    take: 10 // recent orders only — an old fully-reviewed order shouldn't keep this query heavy
  });

  for (const order of orders) {
    if (dismissedOrderIds.has(order.id)) continue;
    const unreviewedItem = order.items.find((item) => !item.review || item.review.deletedAt);
    if (unreviewedItem) {
      return { orderId: order.id, orderNumber: order.orderNumber, orderItemId: unreviewedItem.id };
    }
  }

  return null;
}
