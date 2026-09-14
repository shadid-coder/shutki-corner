'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderItemId = searchParams.get('orderItemId') ?? '';

  const [rating, setRating] = useState(0);
  const [bodyBn, setBodyBn] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function uploadPhoto(file: File) {
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await fetch('/api/reviews/upload', { method: 'POST', body: formData });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'ছবি আপলোড করা যায়নি');
        return;
      }
      setPhotoUrl(body.photoUrl);
    } catch {
      setError('ছবি আপলোড করা যায়নি');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating === 0) return setError('একটি রেটিং দিন');
    if (bodyBn.trim().length < 5) return setError('আপনার মতামত লিখুন');

    setSubmitting(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderItemId, rating, bodyBn, ...(photoUrl ? { photoUrl } : {}) })
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) return setError(body.error);
    setDone(true);
  }

  if (done) {
    return (
      <div className="container-app max-w-md py-16 text-center">
        <div className="text-4xl">🙏</div>
        <h1 className="mt-3 text-xl font-bold text-navy-950">ধন্যবাদ, আপনার মতামত জমা হয়েছে</h1>
        <p className="mt-2 text-navy-700">মডারেশনের পর এটি পণ্যের পাতায় প্রদর্শিত হবে।</p>
        <button onClick={() => router.push('/account/orders')} className="btn-primary mt-6">
          অর্ডারে ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="container-app max-w-md py-10">
      <h1 className="text-xl font-bold text-navy-950">পণ্যটি কেমন লেগেছে? আপনার সৎ মতামত জানান</h1>
      <p className="mt-1 text-sm text-navy-700">আপনার মতামত আমাদের জন্য গুরুত্বপূর্ণ। ইতিবাচক বা নেতিবাচক — যেকোনো সৎ মতামত স্বাগত।</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-navy-800">রেটিং দিন</p>
          <div className="mt-1 flex gap-1 text-3xl" role="radiogroup" aria-label="রেটিং">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} তারা`}
                aria-pressed={rating === n}
                className={n <= rating ? 'text-amber-500' : 'text-beige-200'}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="bodyBn" className="text-sm font-medium text-navy-800">
            আপনার মতামত
          </label>
          <textarea id="bodyBn" rows={5} className="input-field mt-1" value={bodyBn} onChange={(e) => setBodyBn(e.target.value)} />
        </div>

        <div>
          <label htmlFor="photo" className="text-sm font-medium text-navy-800">
            ছবি যোগ করুন (ঐচ্ছিক)
          </label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="input-field mt-1"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto(file);
            }}
          />
          {uploading && <p className="mt-1 text-xs text-navy-700">আপলোড হচ্ছে...</p>}
          {photoUrl && !uploading && (
            <div className="relative mt-2 h-20 w-20 overflow-hidden rounded-lg bg-beige-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="আপলোড করা ছবি" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <p className="text-xs text-navy-700">
          আপনার রিভিউ জমা দেওয়ার পর ৪৮ ঘণ্টার মধ্যে সম্পাদনা বা মুছে ফেলা যাবে।
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'জমা হচ্ছে...' : 'রিভিউ জমা দিন'}
        </button>
      </form>
    </div>
  );
}
