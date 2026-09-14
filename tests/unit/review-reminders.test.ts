import { describe, it, expect } from 'vitest';
import { decideReviewReminderAction } from '../../src/lib/review-reminders';

const DAY_MS = 24 * 60 * 60 * 1000;
const DELIVERED_AT = new Date('2026-01-01T00:00:00Z');

describe('decideReviewReminderAction', () => {
  it('sends nothing before the first-reminder window has elapsed', () => {
    const now = new Date(DELIVERED_AT.getTime() + 2 * DAY_MS); // firstReminderDays = 3
    const action = decideReviewReminderAction(
      { deliveredAt: DELIVERED_AT, hasUnreviewedItems: true, dismissed: false, reminderNotificationsSentAt: [] },
      now
    );
    expect(action).toBe('none');
  });

  it('sends the first reminder once the configured number of days has passed', () => {
    const now = new Date(DELIVERED_AT.getTime() + 3 * DAY_MS);
    const action = decideReviewReminderAction(
      { deliveredAt: DELIVERED_AT, hasUnreviewedItems: true, dismissed: false, reminderNotificationsSentAt: [] },
      now
    );
    expect(action).toBe('send_first');
  });

  it('does not send a second reminder before the final-reminder window has elapsed', () => {
    const firstSentAt = new Date(DELIVERED_AT.getTime() + 3 * DAY_MS);
    const now = new Date(firstSentAt.getTime() + 5 * DAY_MS); // finalReminderDays = 7
    const action = decideReviewReminderAction(
      { deliveredAt: DELIVERED_AT, hasUnreviewedItems: true, dismissed: false, reminderNotificationsSentAt: [firstSentAt] },
      now
    );
    expect(action).toBe('none');
  });

  it('sends the final reminder once the configured number of days has passed since the first', () => {
    const firstSentAt = new Date(DELIVERED_AT.getTime() + 3 * DAY_MS);
    const now = new Date(firstSentAt.getTime() + 7 * DAY_MS);
    const action = decideReviewReminderAction(
      { deliveredAt: DELIVERED_AT, hasUnreviewedItems: true, dismissed: false, reminderNotificationsSentAt: [firstSentAt] },
      now
    );
    expect(action).toBe('send_final');
  });

  it('never sends a third reminder once both have already gone out', () => {
    const firstSentAt = new Date(DELIVERED_AT.getTime() + 3 * DAY_MS);
    const finalSentAt = new Date(firstSentAt.getTime() + 7 * DAY_MS);
    const now = new Date(finalSentAt.getTime() + 30 * DAY_MS);
    const action = decideReviewReminderAction(
      {
        deliveredAt: DELIVERED_AT,
        hasUnreviewedItems: true,
        dismissed: false,
        reminderNotificationsSentAt: [firstSentAt, finalSentAt]
      },
      now
    );
    expect(action).toBe('none');
  });

  it('stops immediately once every item has been reviewed, regardless of timing', () => {
    const now = new Date(DELIVERED_AT.getTime() + 100 * DAY_MS);
    const action = decideReviewReminderAction(
      { deliveredAt: DELIVERED_AT, hasUnreviewedItems: false, dismissed: false, reminderNotificationsSentAt: [] },
      now
    );
    expect(action).toBe('none');
  });

  it('stops immediately once the customer has dismissed it, even if otherwise due', () => {
    const now = new Date(DELIVERED_AT.getTime() + 100 * DAY_MS);
    const action = decideReviewReminderAction(
      { deliveredAt: DELIVERED_AT, hasUnreviewedItems: true, dismissed: true, reminderNotificationsSentAt: [] },
      now
    );
    expect(action).toBe('none');
  });

  it('sorts out-of-order reminder timestamps before deciding (defensive)', () => {
    const firstSentAt = new Date(DELIVERED_AT.getTime() + 3 * DAY_MS);
    const now = new Date(firstSentAt.getTime() + 7 * DAY_MS);
    // Pass a single timestamp but out of chronological order relative to
    // nothing else — this mainly guards against future callers passing
    // more than one entry unsorted.
    const action = decideReviewReminderAction(
      { deliveredAt: DELIVERED_AT, hasUnreviewedItems: true, dismissed: false, reminderNotificationsSentAt: [firstSentAt] },
      now
    );
    expect(action).toBe('send_final');
  });
});
