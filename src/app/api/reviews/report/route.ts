import { NextRequest, NextResponse } from 'next/server';
import { reviewReportSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { requireCustomer } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: 'রিপোর্ট করতে লগইন করুন' }, { status: 401 });
  }

  const limit = await rateLimit(`report:${session.userId}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে' }, { status: 429 });

  const parsed = reviewReportSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'অনুরোধ সঠিক নয়' }, { status: 400 });

  const report = await prisma.reviewReport.create({
    data: { ...parsed.data, reporterUserId: session.userId }
  });

  return NextResponse.json(report, { status: 201 });
}
