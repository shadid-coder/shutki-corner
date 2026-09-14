import { NextRequest, NextResponse } from 'next/server';
import { reviewSubmitSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { requireCustomer } from '@/lib/auth';
import { canSubmitReview } from '@/lib/review-eligibility';
import { rateLimit } from '@/lib/rate-limit';
import { isReviewPhotoUrlOwnedBy } from '@/lib/storage/provider';

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: 'রিভিউ দিতে লগইন করুন' }, { status: 401 });
  }

  const limit = await rateLimit(`review:${session.userId}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে' }, { status: 429 });

  const parsed = reviewSubmitSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'ফর্মটি সঠিকভাবে পূরণ করুন' }, { status: 400 });
  const data = parsed.data;

  // Reject any photoUrl that wasn't produced by our own upload endpoint
  // for this specific user — blocks arbitrary external URLs and blocks
  // reusing another customer's uploaded photo.
  if (data.photoUrl && !isReviewPhotoUrlOwnedBy(data.photoUrl, session.userId)) {
    return NextResponse.json({ error: 'অবৈধ ছবির লিংক' }, { status: 400 });
  }

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: data.orderItemId },
    include: { order: true, review: true, variant: true }
  });

  if (!orderItem || orderItem.order.userId !== session.userId) {
    return NextResponse.json({ error: 'এই পণ্যের অর্ডার খুঁজে পাওয়া যায়নি' }, { status: 404 });
  }

  const eligibility = canSubmitReview({
    orderItemId: orderItem.id,
    orderStatus: orderItem.order.status,
    alreadyReviewed: Boolean(orderItem.review)
  });
  if (!eligibility.eligible) {
    return NextResponse.json({ error: eligibility.reasonBn }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      productId: orderItem.variant.productId,
      orderItemId: orderItem.id,
      userId: session.userId,
      rating: data.rating,
      bodyBn: data.bodyBn,
      photoUrl: data.photoUrl,
      isVerified: true,
      status: 'PENDING' // goes to moderation queue before appearing publicly
    }
  });

  return NextResponse.json(review, { status: 201 });
}
