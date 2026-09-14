'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ReviewData {
  id: string;
  rating: number;
  bodyBn: string;
  photoUrl: string | null;
  canEdit: boolean;
}

export default function EditReviewPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const router = useRouter();

  const [review, setReview] = useState<ReviewData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [bodyBn, setBodyBn] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState<'saved' | 'deleted' | null>(null);

  useEffect(() => {
    fetch(`/api/reviews/${reviewId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setLoadError(body.error ?? 'রিভিউ খুঁজে পাওয়া যায়নি');
          return;
        }
        setReview(body);
        setRating(body.rating);
        setBodyBn(body.bodyBn);
        setPhotoUrl(body.photoUrl);
      })
      .catch(() => setLoadError('রিভিউ লোড করা যায়নি'));
  }, [reviewId]);

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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating === 0) return setError('একটি রেটিং দিন');
    if (bodyBn.trim().length < 5) return setError('আপনার মতামত লিখুন');

    setSubmitting(true);
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, bodyBn, ...(photoUrl ? { photoUrl } : {}) })
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) return setError(body.error);
    setDone('saved');
  }

  async function remove() {
    if (!confirm('আপনি কি নিশ্চিত যে এই রিভিউটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
    const body = await res.json();
    setDeleting(false);
    if (!res.ok) return setError(body.error);
    setDone('deleted');
  }

  if (loadError) {
    return (
      <div className="container-app max-w-md py-16 text-center">
        <p className="text-navy-800">{loadError}</p>
        <button onClick={() => router.push('/account/orders')} className="btn-secondary mt-4">
          অর্ডারে ফিরে যান
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container-app max-w-md py-16 text-center">
        <div className="text-4xl">{done === 'saved' ? '✅' : '🗑️'}</div>
        <h1 className="mt-3 text-xl font-bold text-navy-950">
          {done === 'saved' ? 'আপনার রিভিউ হালনাগাদ করা হয়েছে' : 'রিভিউটি মুছে ফেলা হয়েছে'}
        </h1>
        {done === 'saved' && <p className="mt-2 text-navy-700">পুনরায় মডারেশনের পর এটি প্রদর্শিত হবে।</p>}
        <button onClick={() => router.push('/account/orders')} className="btn-primary mt-6">
          অর্ডারে ফিরে যান
        </button>
      </div>
    );
  }

  if (!review) {
    return <div className="container-app py-16 text-center text-navy-700">লোড হচ্ছে...</div>;
  }

  if (!review.canEdit) {
    return (
      <div className="container-app max-w-md py-16 text-center">
        <p className="text-navy-800">এই রিভিউটি সম্পাদনার সময়সীমা শেষ হয়ে গেছে।</p>
        <button onClick={() => router.push('/account/orders')} className="btn-secondary mt-4">
          অর্ডারে ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="container-app max-w-md py-10">
      <h1 className="text-xl font-bold text-navy-950">আপনার রিভিউ সম্পাদনা করুন</h1>
      <p className="mt-1 text-sm text-navy-700">সম্পাদনার পর রিভিউটি পুনরায় মডারেশনের মধ্য দিয়ে যাবে।</p>

      <form onSubmit={save} className="mt-6 space-y-4">
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
            ছবি পরিবর্তন করুন (ঐচ্ছিক)
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting || uploading} className="btn-primary w-full">
          {submitting ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
        </button>
        <button type="button" onClick={remove} disabled={deleting} className="w-full text-sm text-red-600 underline">
          {deleting ? 'মুছে ফেলা হচ্ছে...' : 'রিভিউটি মুছে ফেলুন'}
        </button>
      </form>
    </div>
  );
}
