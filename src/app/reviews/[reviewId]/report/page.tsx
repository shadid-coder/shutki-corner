'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const REASONS = [
  { value: 'SPAM', label: 'স্প্যাম' },
  { value: 'ABUSIVE', label: 'আপত্তিকর' },
  { value: 'IRRELEVANT', label: 'অপ্রাসঙ্গিক' },
  { value: 'FAKE', label: 'ভুয়া মনে হচ্ছে' },
  { value: 'OTHER', label: 'অন্যান্য' }
] as const;

export default function ReportReviewPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const router = useRouter();
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('SPAM');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/reviews/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, reason, note })
    });
    const body = await res.json();
    if (!res.ok) return setError(body.error);
    setDone(true);
  }

  if (done) {
    return (
      <div className="container-app max-w-sm py-16 text-center">
        <p className="text-navy-950">রিপোর্ট পাঠানো হয়েছে। আমাদের টিম পর্যালোচনা করবে।</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4">
          ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="container-app max-w-sm py-10">
      <h1 className="text-xl font-bold text-navy-950">রিভিউ রিপোর্ট করুন</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <select className="input-field" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <textarea placeholder="অতিরিক্ত তথ্য (ঐচ্ছিক)" className="input-field" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full">
          জমা দিন
        </button>
      </form>
    </div>
  );
}
