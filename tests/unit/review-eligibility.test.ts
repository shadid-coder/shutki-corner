import { describe, it, expect } from 'vitest';
import { canSubmitReview, canEditReview, reviewEditDeadline } from '../../src/lib/review-eligibility';

describe('canSubmitReview', () => {
  it('is eligible for a delivered, not-yet-reviewed order item', () => {
    const result = canSubmitReview({ orderItemId: 'oi1', orderStatus: 'DELIVERED', alreadyReviewed: false });
    expect(result.eligible).toBe(true);
  });

  it('is not eligible before delivery', () => {
    const result = canSubmitReview({ orderItemId: 'oi1', orderStatus: 'SHIPPED', alreadyReviewed: false });
    expect(result.eligible).toBe(false);
    expect(result.reasonBn).toBeDefined();
  });

  it('is not eligible if already reviewed, even when delivered', () => {
    const result = canSubmitReview({ orderItemId: 'oi1', orderStatus: 'DELIVERED', alreadyReviewed: true });
    expect(result.eligible).toBe(false);
  });

  it('is not eligible for a cancelled order', () => {
    const result = canSubmitReview({ orderItemId: 'oi1', orderStatus: 'CANCELLED', alreadyReviewed: false });
    expect(result.eligible).toBe(false);
  });
});

describe('canEditReview', () => {
  it('allows edits within the configured window', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-01-01T10:00:00Z'); // 10h later, window is 48h
    expect(canEditReview(createdAt, now)).toBe(true);
  });

  it('disallows edits after the configured window', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-01-05T00:00:00Z'); // 4 days later
    expect(canEditReview(createdAt, now)).toBe(false);
  });

  it('reviewEditDeadline is exactly createdAt + window', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const deadline = reviewEditDeadline(createdAt);
    expect(deadline.getTime() - createdAt.getTime()).toBe(48 * 60 * 60 * 1000);
  });
});
