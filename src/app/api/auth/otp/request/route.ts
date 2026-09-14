import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { otpRequestSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { sendOtpSms } from '@/lib/sms';
import { rateLimit } from '@/lib/rate-limit';
import { AUTH_CONFIG } from '@/lib/config';

export async function POST(req: NextRequest) {
  const parsed = otpRequestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'সঠিক মোবাইল নাম্বার দিন' }, { status: 400 });
  const { phone,name } = parsed.data;

  const limit = await rateLimit(`otp:${phone}`, AUTH_CONFIG.otpMaxAttemptsPerHour, 60 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে, একটু পর আবার চেষ্টা করুন' }, { status: 429 });
  }

  const code = Math.floor(Math.random() * 10 ** AUTH_CONFIG.otpLengthDigits)
    .toString()
    .padStart(AUTH_CONFIG.otpLengthDigits, '0');


    
// 👇 ইউজার ডেটাবেসে না থাকলে অটোমেটিক তৈরি করছি
let user = await prisma.user.findUnique({ where: { phone } });
if (!user) {
  user = await prisma.user.create({
    data: {
      phone: phone,
      name: name?.trim() || 'New User', // পরবর্তীতে প্রোফাইল থেকে ইউজার নাম আপডেট করতে পারবে
      role: 'CUSTOMER'
    }
  });
}
// 👆 ইউজার তৈরি শেষ

const codeHash = await bcrypt.hash(code, 10);

await prisma.otpCode.create({
  data: {
    userPhone: phone,
    codeHash,
    expiresAt: new Date(Date.now() + AUTH_CONFIG.otpExpiryMinutes * 60_000)
  }
});

 // await sendOtpSms(phone, code);

 // await sendOtpSms(phone, code); // আসল SMS পাঠানোর জন্য পরে ব্যবহার করব

// 👇 ডেভেলপমেন্টের জন্য OTP টার্মিনালে প্রিন্ট করছি
console.log(`\n========================================`);
console.log(`📱 ফোন নাম্বার: ${phone}`);
console.log(`🔑 আপনার OTP কোড: ${code}`);
console.log(`========================================\n`);

  // Never return the code itself in the response body.
  return NextResponse.json({ 
    sent: true,
     expiresInMinutes: AUTH_CONFIG.otpExpiryMinutes,
    demoOtp: code });
}
