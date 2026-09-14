'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { ReviewStatus } from '@prisma/client';

async function setReviewStatus(reviewId: string, status: ReviewStatus, action: string, reason?: string) {
  const admin = await requireAdmin();
  const before = await prisma.review.findUniqueOrThrow({ where: { id: reviewId } });
  const after = await prisma.review.update({ where: { id: reviewId }, data: { status } });

  // Every status change is logged — this is the only mechanism by which
  // an admin can affect a review's visibility, and the rating itself is
  // never touched by any admin action.
  await prisma.reviewAuditLog.create({
    data: {
      reviewId,
      adminId: admin.userId,
      action,
      beforeJson: { status: before.status, rating: before.rating },
      afterJson: { status: after.status, rating: after.rating },
      reason
    }
  });

  revalidatePath('/admin/reviews');
}

export async function approveReview(reviewId: string) {
  return setReviewStatus(reviewId, 'APPROVED', 'approve');
}

export async function rejectReview(reviewId: string, reason: string) {
  if (!reason.trim()) throw new Error('বাতিলের কারণ আবশ্যক');
  return setReviewStatus(reviewId, 'REJECTED', 'reject', reason);
}

export async function hideReview(reviewId: string, reason: string) {
  if (!reason.trim()) throw new Error('লুকানোর কারণ আবশ্যক');
  return setReviewStatus(reviewId, 'HIDDEN', 'hide', reason);
}

export async function restoreReview(reviewId: string) {
  return setReviewStatus(reviewId, 'APPROVED', 'restore');
}

export async function resolveReport(reportId: string, action: 'DISMISSED' | 'ACTIONED') {
  await requireAdmin();
  await prisma.reviewReport.update({ where: { id: reportId }, data: { status: action } });
  revalidatePath('/admin/reviews');
}
