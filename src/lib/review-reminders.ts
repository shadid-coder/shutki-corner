import { REVIEW_CONFIG } from './config';

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewReminderAction = 'none' | 'send_first' | 'send_final';

export interface ReviewReminderInput {
  /** When the order was marked Delivered. */
  deliveredAt: Date;
  /** True if at least one item on this order still has no active
   * (non-deleted) review. Once every item is reviewed, reminders stop —
   * per the original spec, "stop reminders after the customer submits a
   * review". */
  hasUnreviewedItems: boolean;
  /** True if the customer explicitly dismissed the reminder for this
   * order (see POST /api/notifications/review-reminder/dismiss). */
  dismissed: boolean;
  /** createdAt timestamps of REVIEW_REMINDER notifications already sent
   * for this order, in any order — this function sorts them. */
  reminderNotificationsSentAt: Date[];
}

/** Single source of truth for reminder timing, used by the scheduler
 * (src/app/api/cron/review-reminders/route.ts) so the actual decision
 * can be unit tested without touching the database or a clock mock
 * beyond passing in `now`. */
export function decideReviewReminderAction(input: ReviewReminderInput, now: Date = new Date()): ReviewReminderAction {
  if (input.dismissed || !input.hasUnreviewedItems) {
    return 'none';
  }

  const sent = [...input.reminderNotificationsSentAt].sort((a, b) => a.getTime() - b.getTime());

  if (sent.length === 0) {
    const dueAt = input.deliveredAt.getTime() + REVIEW_CONFIG.firstReminderDays * DAY_MS;
    return now.getTime() >= dueAt ? 'send_first' : 'none';
  }

  if (sent.length === 1) {
    const dueAt = sent[0]!.getTime() + REVIEW_CONFIG.finalReminderDays * DAY_MS;
    return now.getTime() >= dueAt ? 'send_final' : 'none';
  }

  // Both reminders already sent — never send a third.
  return 'none';
}
