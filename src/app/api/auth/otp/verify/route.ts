import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { otpVerifySchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const parsed = otpVerifySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'সঠিক কোড দিন' }, { status: 400 });
  const { phone, code } = parsed.data;

  const limit = await rateLimit(`otp-verify:${phone}`, 5, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে' }, { status: 429 });

  const latest = await prisma.otpCode.findFirst({
    where: { userPhone: phone, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  });
  if (!latest) return NextResponse.json({ error: 'কোডের মেয়াদ শেষ, নতুন কোড চান' }, { status: 400 });

  const valid = await bcrypt.compare(code, latest.codeHash);
  if (!valid) return NextResponse.json({ error: 'কোডটি সঠিক নয়' }, { status: 400 });

  await prisma.otpCode.update({ where: { id: latest.id }, data: { consumed: true } });

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone }
  });

  await createSession({ userId: user.id, phone: user.phone, role: user.role });
  return NextResponse.json({ ok: true, userId: user.id });
}
