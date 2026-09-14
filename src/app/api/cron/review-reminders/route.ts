import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decideReviewReminderAction } from '@/lib/review-reminders';

/**
 * This route does the actual work described by REVIEW_CONFIG
 * (src/lib/config.ts) — it does not run itself on a schedule. Wire up an
 * external trigger to call it periodically (once a day is enough, given
 * the reminder windows are measured in days):
 *
 *   - Vercel: add a Cron Job in vercel.json hitting this path, e.g.
 *       { "crons": [{ "path": "/api/cron/review-reminders", "schedule": "0 3 * * *" }] }
 *     Vercel Cron sends its own auth automatically if you protect the
 *     route with `CRON_SECRET` the way Vercel's docs describe; the
 *     simpler, host-agnostic option used here is a manually-set bearer
 *     token so this also works outside Vercel (cron-job.org, a
 *     self-hosted crontab calling `curl`, GitHub Actions schedule, etc).
 *   - Anywhere else: any scheduler that can send
 *       Authorization: Bearer <CRON_SECRET>
 *     as an HTTP header on a daily timer.
 *
 * Required env var: CRON_SECRET — a long random string, shared between
 * this app and whatever triggers it. If it isn't set, this route refuses
 * to run at all rather than silently accepting unauthenticated requests.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured — refusing to run. Set it in your environment first.' },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const candidateOrders = await prisma.order.findMany({
    where: { status: 'DELIVERED', deliveredAt: { not: null } },
    include: { items: { include: { review: true } } }
  });

  if (candidateOrders.length === 0) {
    return NextResponse.json({ checked: 0, firstRemindersSent: 0, finalRemindersSent: 0 });
  }

  // Fetch all reminder-related notifications once, rather than once per
  // order — Notification doesn't have a first-class orderId column (it
  // stores it in `payload`), so we index them here in JS.
  const relevantNotifications = await prisma.notification.findMany({
    where: { type: { in: ['REVIEW_REMINDER', 'REVIEW_REMINDER_DISMISSED'] } },
    select: { type: true, payload: true, createdAt: true }
  });

  const reminderSentByOrderId = new Map<string, Date[]>();
  const dismissedOrderIds = new Set<string>();
  for (const n of relevantNotifications) {
    const orderId = (n.payload as { orderId?: string } | null)?.orderId;
    if (!orderId) continue;
    if (n.type === 'REVIEW_REMINDER_DISMISSED') {
      dismissedOrderIds.add(orderId);
    } else {
      const list = reminderSentByOrderId.get(orderId) ?? [];
      list.push(n.createdAt);
      reminderSentByOrderId.set(orderId, list);
    }
  }

  let firstRemindersSent = 0;
  let finalRemindersSent = 0;

  for (const order of candidateOrders) {
    if (!order.deliveredAt) continue; // narrows the type; already filtered by the query

    const hasUnreviewedItems = order.items.some((item) => !item.review || item.review.deletedAt);

    const action = decideReviewReminderAction({
      deliveredAt: order.deliveredAt,
      hasUnreviewedItems,
      dismissed: dismissedOrderIds.has(order.id),
      reminderNotificationsSentAt: reminderSentByOrderId.get(order.id) ?? []
    });

    if (action === 'none') continue;

    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'REVIEW_REMINDER',
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          stage: action === 'send_first' ? 'first' : 'final'
        }
      }
    });

    if (action === 'send_first') firstRemindersSent += 1;
    else finalRemindersSent += 1;
  }

  return NextResponse.json({
    checked: candidateOrders.length,
    firstRemindersSent,
    finalRemindersSent
  });
}
