'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatTaka } from '@/lib/format';

interface Variant {
  id: string;
  label: string;
  price: number;
  stockQty: number;
}

export default function AddToCartForm({ variants }: { variants: Variant[] }) {
  const inStockVariants = variants.filter((v) => v.stockQty > 0);
  const [selectedId, setSelectedId] = useState(inStockVariants[0]?.id ?? variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const router = useRouter();

  const selected = variants.find((v) => v.id === selectedId);
  const outOfStock = !selected || selected.stockQty <= 0;

  async function addToCart(buyNow: boolean) {
    if (!selected || outOfStock) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: selected.id, qty })
      });
      if (!res.ok) throw new Error('failed');
      setStatus('done');
      if (buyNow) router.push('/cart');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-navy-800">প্যাকেজ সাইজ নির্বাচন করুন</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              disabled={v.stockQty <= 0}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                selectedId === v.id ? 'border-sea-500 bg-sea-100 text-navy-950' : 'border-beige-200 text-navy-800'
              } ${v.stockQty <= 0 ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {v.label} — {formatTaka(v.price)}
              {v.stockQty <= 0 && ' (স্টকে নেই)'}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex items-center gap-3">
          <label htmlFor="qty" className="text-sm font-medium text-navy-800">
            পরিমাণ
          </label>
          <div className="flex items-center rounded-lg border border-beige-200">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-3 py-1.5 text-lg"
              aria-label="কমান"
            >
              −
            </button>
            <span id="qty" className="w-8 text-center">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(selected.stockQty, q + 1))}
              className="px-3 py-1.5 text-lg"
              aria-label="বাড়ান"
            >
              +
            </button>
          </div>
        </div>
      )}

      {outOfStock && <p className="text-sm font-medium text-red-600">এই পণ্যটি বর্তমানে স্টকে নেই</p>}

      <div className="flex gap-3">
        <button type="button" disabled={outOfStock || status === 'loading'} onClick={() => addToCart(false)} className="btn-secondary flex-1">
          {status === 'loading' ? 'যোগ হচ্ছে...' : 'কার্টে যোগ করুন'}
        </button>
        <button type="button" disabled={outOfStock || status === 'loading'} onClick={() => addToCart(true)} className="btn-primary flex-1">
          এখনই কিনুন
        </button>
      </div>

      {status === 'done' && <p className="text-sm text-sea-600">কার্টে যোগ করা হয়েছে</p>}
      {status === 'error' && <p className="text-sm text-red-600">সমস্যা হয়েছে, আবার চেষ্টা করুন</p>}
    </div>
  );
}
