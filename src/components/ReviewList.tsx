import Link from 'next/link';
import StarRating from './StarRating';
import { anonymizeName } from '@/lib/anonymize';
import { prisma } from '@/lib/prisma';

type SortOption = 'newest' | 'highest' | 'lowest' | 'verified';

export default async function ReviewList({ productId, sort = 'newest' }: { productId: string; sort?: SortOption }) {
  const orderBy =
    sort === 'highest'
      ? { rating: 'desc' as const }
      : sort === 'lowest'
        ? { rating: 'asc' as const }
        : { createdAt: 'desc' as const };

  const reviews = await prisma.review.findMany({
    where: { productId, status: 'APPROVED', deletedAt: null },
    orderBy,
    include: { user: true }
  });

  const sorted = sort === 'verified' ? [...reviews].sort((a, b) => Number(b.isVerified) - Number(a.isVerified)) : reviews;

  if (sorted.length === 0) {
    return <p className="text-navy-700">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন আপনার অর্ডার ডেলিভারি হওয়ার পর।</p>;
  }

  return (
    <div className="space-y-4">
      {sorted.map((r) => (
        <div key={r.id} className="border-b border-beige-200 pb-4">
          <div className="flex items-center justify-between">
            <StarRating value={r.rating} />
            <span className="text-xs text-navy-700">
              {new Intl.DateTimeFormat('bn-BD', { dateStyle: 'medium' }).format(r.createdAt)}
            </span>
          </div>
          <p className="mt-2 text-navy-800">{r.bodyBn}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-navy-700">
            <span>
              {anonymizeName(r.user.name ?? 'ক্রেতা')}
              {r.isVerified && <span className="ml-2 text-sea-600">✓ যাচাইকৃত ক্রয়</span>}
            </span>
            <Link href={`/reviews/${r.id}/report`} className="underline">
              রিপোর্ট করুন
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
