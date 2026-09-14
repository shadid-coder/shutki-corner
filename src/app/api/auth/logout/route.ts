import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST() {
  clearSession();
  // লগআউট করে হোমপেজে পাঠাচ্ছে
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'));
}