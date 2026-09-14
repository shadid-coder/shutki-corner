'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReviewRequestCard({
  orderId,
  orderNumber,
  orderItemId
}: {
  orderId: string;
  orderNumber: string;
  orderItemId: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  async function dismiss() {
    setDismissing(true);
    try {
      await fetch('/api/notifications/review-reminder/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
    } finally {
      // Hide it either way — worst case it reappears next visit, which
      // is harmless, versus leaving a stuck card if the request fails.
      setDismissed(true);
      setDismissing(false);
    }
  }

  if (dismissed) return null;

  return (
    <section className="container-app py-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 border-sea-500/40 bg-sea-100/40">
        <div>
          <p className="font-semibold text-navy-950">পণ্যটি কেমন লেগেছে? আপনার সৎ মতামত জানান</p>
          <p className="mt-0.5 text-sm text-navy-700">অর্ডার {orderNumber} ডেলিভার হয়েছে — আপনার মতামত আমাদের জন্য গুরুত্বপূর্ণ।</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/reviews/new?orderItemId=${orderItemId}`} className="btn-primary py-2">
            রিভিউ দিন
          </Link>
          <button
            type="button"
            onClick={dismiss}
            disabled={dismissing}
            aria-label="বন্ধ করুন"
            className="text-sm text-navy-700 underline disabled:opacity-50"
          >
            পরে দেখাবো না
          </button>
        </div>
      </div>
    </section>
  );
}
