import { describe, it, expect } from 'vitest';
import { canEditOwnReview, canDeleteOwnReview } from '../../src/lib/review-eligibility';

const HOUR = 60 * 60 * 1000;

describe('canEditOwnReview', () => {
  it('owner can edit within the window', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-01-01T10:00:00Z'); // 10h later, window is 48h
    const decision = canEditOwnReview({ reviewOwnerId: 'u1', requesterId: 'u1', createdAt, deletedAt: null }, now);
    expect(decision.allowed).toBe(true);
  });

  it('owner cannot edit after the window has closed', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date(createdAt.getTime() + 49 * HOUR); // window is 48h
    const decision = canEditOwnReview({ reviewOwnerId: 'u1', requesterId: 'u1', createdAt, deletedAt: null }, now);
    expect(decision.allowed).toBe(false);
    expect(decision.reasonBn).toBeDefined();
  });

  it('another user cannot edit someone else\'s review, even within the window', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date(createdAt.getTime() + HOUR);
    const decision = canEditOwnReview({ reviewOwnerId: 'u1', requesterId: 'u2', createdAt, deletedAt: null }, now);
    expect(decision.allowed).toBe(false);
  });

  it('cannot edit a review that has already been deleted', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const deletedAt = new Date(createdAt.getTime() + HOUR);
    const now = new Date(createdAt.getTime() + 2 * HOUR);
    const decision = canEditOwnReview({ reviewOwnerId: 'u1', requesterId: 'u1', createdAt, deletedAt }, now);
    expect(decision.allowed).toBe(false);
  });

  it('ownership is checked before the time window (wrong owner + expired window still reports not-owner)', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date(createdAt.getTime() + 100 * HOUR); // window long expired
    const decision = canEditOwnReview({ reviewOwnerId: 'u1', requesterId: 'u2', createdAt, deletedAt: null }, now);
    expect(decision.allowed).toBe(false);
  });
});

describe('canDeleteOwnReview', () => {
  it('owner can delete within the allowed period', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date(createdAt.getTime() + HOUR);
    const decision = canDeleteOwnReview({ reviewOwnerId: 'u1', requesterId: 'u1', createdAt, deletedAt: null }, now);
    expect(decision.allowed).toBe(true);
  });

  it('owner cannot delete after the allowed period', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date(createdAt.getTime() + 49 * HOUR);
    const decision = canDeleteOwnReview({ reviewOwnerId: 'u1', requesterId: 'u1', createdAt, deletedAt: null }, now);
    expect(decision.allowed).toBe(false);
  });

  it('another user cannot delete someone else\'s review', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date(createdAt.getTime() + HOUR);
    const decision = canDeleteOwnReview({ reviewOwnerId: 'u1', requesterId: 'intruder', createdAt, deletedAt: null }, now);
    expect(decision.allowed).toBe(false);
    expect(decision.reasonBn).toBeDefined();
  });

  it('cannot delete an already-deleted review', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const deletedAt = new Date(createdAt.getTime() + HOUR);
    const now = new Date(createdAt.getTime() + 2 * HOUR);
    const decision = canDeleteOwnReview({ reviewOwnerId: 'u1', requesterId: 'u1', createdAt, deletedAt }, now);
    expect(decision.allowed).toBe(false);
  });
});
