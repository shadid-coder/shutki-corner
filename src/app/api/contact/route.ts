import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

// In production, wire this to an email/SMS notification for the admin
// (e.g. Resend, or an internal Notification row + admin dashboard inbox).
// Kept as a stub here so the contact page has a real endpoint to submit to.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const limit = await rateLimit(`contact:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে, একটু পর আবার চেষ্টা করুন' }, { status: 429 });
  }

  const parsed = contactFormSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'ফর্মটি সঠিকভাবে পূরণ করুন' }, { status: 400 });
  }

  // eslint-disable-next-line no-console
  console.log('[CONTACT FORM]', parsed.data);

  return NextResponse.json({ ok: true });
}
