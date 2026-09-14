import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireCustomer } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const dismissSchema = z.object({ orderId: z.string().min(1) });

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: 'লগইন করুন' }, { status: 401 });
  }

  const limit = await rateLimit(`review-reminder-dismiss:${session.userId}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে' }, { status: 429 });

  const parsed = dismissSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'অনুরোধ সঠিক নয়' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ error: 'অর্ডার খুঁজে পাওয়া যায়নি' }, { status: 404 });
  }

  // Dismissing never blocks the customer from still submitting a review
  // later (the review flow doesn't check this at all) — it only stops
  // future reminder notifications for this order, per the spec's "never
  // block ... any core feature if the customer does not review."
  await prisma.notification.create({
    data: { userId: session.userId, type: 'REVIEW_REMINDER_DISMISSED', payload: { orderId: order.id } }
  });

  return NextResponse.json({ dismissed: true });
}
