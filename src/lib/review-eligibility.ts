import { REVIEW_CONFIG } from './config';

export interface OrderItemForReview {
  orderItemId: string;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  alreadyReviewed: boolean;
}

/** A customer may submit a review only when:
 *  1. the order containing that line item is Delivered, and
 *  2. no review already exists for that specific order item.
 * This is the single source of truth for eligibility — used by both the
 * UI (to show/hide the review button) and the API (to reject writes). */
export function canSubmitReview(item: OrderItemForReview): { eligible: boolean; reasonBn?: string } {
  if (item.alreadyReviewed) {
    return { eligible: false, reasonBn: 'আপনি ইতিমধ্যে এই পণ্যের রিভিউ দিয়েছেন' };
  }
  if (item.orderStatus !== 'DELIVERED') {
    return { eligible: false, reasonBn: 'অর্ডারটি ডেলিভার হওয়ার পর রিভিউ করা যাবে' };
  }
  return { eligible: true };
}

/** A submitted review can be edited/deleted only within the configured
 * window after creation. */
export function canEditReview(createdAt: Date, now: Date = new Date()): boolean {
  const windowMs = REVIEW_CONFIG.editWindowHours * 60 * 60 * 1000;
  return now.getTime() - createdAt.getTime() <= windowMs;
}

export function reviewEditDeadline(createdAt: Date): Date {
  return new Date(createdAt.getTime() + REVIEW_CONFIG.editWindowHours * 60 * 60 * 1000);
}

export interface ReviewOwnershipCheck {
  reviewOwnerId: string;
  requesterId: string;
  createdAt: Date;
  /** Set once a review has already been (soft-)deleted. */
  deletedAt: Date | null;
}

export interface OwnershipDecision {
  allowed: boolean;
  reasonBn?: string;
}

/** Shared gate for both edit and delete: only the review's own author,
 * and only within the configured edit window, and only while the review
 * hasn't already been deleted. Used by both the API route (to actually
 * enforce it) and the UI (to show/hide edit/delete controls) — see
 * src/app/api/reviews/[reviewId]/route.ts. */
export function canEditOwnReview(input: ReviewOwnershipCheck, now: Date = new Date()): OwnershipDecision {
  if (input.deletedAt) {
    return { allowed: false, reasonBn: 'রিভিউটি ইতিমধ্যে মুছে ফেলা হয়েছে' };
  }
  if (input.reviewOwnerId !== input.requesterId) {
    return { allowed: false, reasonBn: 'আপনি শুধুমাত্র নিজের রিভিউ সম্পাদনা করতে পারবেন' };
  }
  if (!canEditReview(input.createdAt, now)) {
    return { allowed: false, reasonBn: 'রিভিউ সম্পাদনার সময়সীমা শেষ হয়ে গেছে' };
  }
  return { allowed: true };
}

/** Deletion follows the same ownership + time-window rule as editing. */
export function canDeleteOwnReview(input: ReviewOwnershipCheck, now: Date = new Date()): OwnershipDecision {
  const decision = canEditOwnReview(input, now);
  if (!decision.allowed && decision.reasonBn === 'আপনি শুধুমাত্র নিজের রিভিউ সম্পাদনা করতে পারবেন') {
    return { allowed: false, reasonBn: 'আপনি শুধুমাত্র নিজের রিভিউ মুছতে পারবেন' };
  }
  return decision;
}
