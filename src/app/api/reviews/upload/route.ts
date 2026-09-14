import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { sniffImageMimeType } from '@/lib/image-sniff';
import { getStorageProvider } from '@/lib/storage/provider';
import { REVIEW_CONFIG } from '@/lib/config';

export const runtime = 'nodejs'; // Buffer is not available on the edge runtime

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ error: 'ছবি আপলোড করতে লগইন করুন' }, { status: 401 });
  }

  const limit = await rateLimit(`review-upload:${session.userId}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে, একটু পর আবার চেষ্টা করুন' }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'ফাইল পড়া যায়নি' }, { status: 400 });
  }

  const file = formData.get('photo');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'একটি ছবি যোগ করুন' }, { status: 400 });
  }

  if (file.size > REVIEW_CONFIG.maxPhotoSizeBytes) {
    const maxMb = (REVIEW_CONFIG.maxPhotoSizeBytes / (1024 * 1024)).toFixed(1);
    return NextResponse.json({ error: `ছবির আকার সর্বোচ্চ ${maxMb}MB হতে পারবে` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // We deliberately ignore `file.type` (client-supplied) and sniff the
  // real format from the file's own bytes — see src/lib/image-sniff.ts.
  const sniffedMime = sniffImageMimeType(buffer);
  if (!sniffedMime) {
    return NextResponse.json({ error: 'শুধুমাত্র JPEG, PNG বা WebP ছবি আপলোড করা যাবে' }, { status: 400 });
  }

  let result;
  try {
    result = await getStorageProvider().uploadReviewPhoto({ buffer, mimeType: sniffedMime, userId: session.userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'ছবি আপলোড করা যায়নি';
    // eslint-disable-next-line no-console
    console.error('[review photo upload]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ photoUrl: result.url }, { status: 201 });
}
