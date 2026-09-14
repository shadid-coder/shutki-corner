import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCustomer } from '@/lib/auth';
import { reviewEditSchema } from '@/lib/validation';
import { canEditOwnReview, canDeleteOwnReview } from '@/lib/review-eligibility';
import { isReviewPhotoUrlOwnedBy } from '@/lib/storage/provider';
import { rateLimit } from '@/lib/rate-limit';

/** GET — fetch your own review, for pre-filling the edit form. Never
 * returns a review belonging to another user, regardless of status
 * (this is not the public read path — see ReviewList/queries.ts for
 * that, which only ever exposes APPROVED, non-deleted reviews). */
export async function GET(_req: NextRequest, { params }: { params: { reviewId: string } }) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: 'লগইন করুন' }, { status: 401 });
  }

  const review = await prisma.review.findUnique({ where: { id: params.reviewId } });
  if (!review || review.userId !== session.userId) {
    return NextResponse.json({ error: 'রিভিউ খুঁজে পাওয়া যায়নি' }, { status: 404 });
  }

  return NextResponse.json({
    id: review.id,
    rating: review.rating,
    bodyBn: review.bodyBn,
    photoUrl: review.photoUrl,
    createdAt: review.createdAt,
    deletedAt: review.deletedAt,
    canEdit: canEditOwnReview({
      reviewOwnerId: review.userId,
      requesterId: session.userId,
      createdAt: review.createdAt,
      deletedAt: review.deletedAt
    }).allowed
  });
}

/** PATCH — edit your own review within the edit window.
 *
 * Only `rating`, `bodyBn`, and `photoUrl` can ever change here: the
 * update payload sent to Prisma is built field-by-field from an
 * allow-list (never a spread of the request body), so `productId`,
 * `orderItemId`, `userId`, and `isVerified` cannot be altered by a
 * customer no matter what the request contains. */
export async function PATCH(req: NextRequest, { params }: { params: { reviewId: string } }) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: 'রিভিউ সম্পাদনা করতে লগইন করুন' }, { status: 401 });
  }

  const limit = await rateLimit(`review-edit:${session.userId}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে' }, { status: 429 });

  const review = await prisma.review.findUnique({ where: { id: params.reviewId } });
  if (!review) return NextResponse.json({ error: 'রিভিউ খুঁজে পাওয়া যায়নি' }, { status: 404 });

  const decision = canEditOwnReview({
    reviewOwnerId: review.userId,
    requesterId: session.userId,
    createdAt: review.createdAt,
    deletedAt: review.deletedAt
  });
  if (!decision.allowed) {
    const status = review.userId !== session.userId ? 403 : 409;
    return NextResponse.json({ error: decision.reasonBn }, { status });
  }

  const parsed = reviewEditSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'ফর্মটি সঠিকভাবে পূরণ করুন' }, { status: 400 });
  }
  const data = parsed.data;

  if (data.photoUrl && !isReviewPhotoUrlOwnedBy(data.photoUrl, session.userId)) {
    return NextResponse.json({ error: 'অবৈধ ছবির লিংক' }, { status: 400 });
  }

  // Edited content goes back through moderation — the admin approved the
  // *original* wording, not whatever the customer changes it to.
  const updated = await prisma.review.update({
    where: { id: review.id },
    data: {
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.bodyBn !== undefined ? { bodyBn: data.bodyBn } : {}),
      ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
      editedAt: new Date(),
      status: 'PENDING'
    }
  });

  return NextResponse.json(updated);
}

/** DELETE — soft-delete your own review within the edit window. The row
 * is kept (so any existing ReviewAuditLog entries stay valid and the
 * fact that a review once existed remains auditable), but `deletedAt`
 * excludes it from every public-facing query. */
export async function DELETE(_req: NextRequest, { params }: { params: { reviewId: string } }) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: 'রিভিউ মুছতে লগইন করুন' }, { status: 401 });
  }

  const limit = await rateLimit(`review-delete:${session.userId}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে' }, { status: 429 });

  const review = await prisma.review.findUnique({ where: { id: params.reviewId } });
  if (!review) return NextResponse.json({ error: 'রিভিউ খুঁজে পাওয়া যায়নি' }, { status: 404 });

  const decision = canDeleteOwnReview({
    reviewOwnerId: review.userId,
    requesterId: session.userId,
    createdAt: review.createdAt,
    deletedAt: review.deletedAt
  });
  if (!decision.allowed) {
    const status = review.userId !== session.userId ? 403 : 409;
    return NextResponse.json({ error: decision.reasonBn }, { status });
  }

  await prisma.review.update({ where: { id: review.id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ deleted: true });
}
