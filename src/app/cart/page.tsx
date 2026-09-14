'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatTaka } from '@/lib/format';

interface CartItem {
  id: string;
  qty: number;
  variant: {
    id: string;
    label: string;
    price: string;
    stockQty: number;
    product: { nameBn: string; images: string[]; slug: string };
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[] | null>(null);

  async function refresh() {
    const res = await fetch('/api/cart');
    const cart = await res.json();
    setItems(cart.items ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function updateQty(itemId: string, qty: number) {
    await fetch('/api/cart', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId, qty }) });
    refresh();
  }

  async function removeItem(itemId: string) {
    await fetch('/api/cart', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
    refresh();
  }

  if (items === null) {
    return (
      <div className="container-app py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-sea-500 border-t-transparent"></div>
        <p className="mt-4 text-navy-700 font-medium">কার্ট লোড হচ্ছে...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-app py-24 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-beige-100 text-5xl">
          🛒
        </div>
        <h2 className="mt-6 text-2xl font-bold text-navy-950">আপনার কার্ট এখন খালি</h2>
        <p className="mt-2 text-navy-600">আমাদের সংগ্রহ থেকে আপনার পছন্দের শুঁটকি যোগ করুন।</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex px-8 py-3">
          পণ্য দেখুন
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.variant.price) * i.qty, 0);

  return (
    <div className="container-app py-8">
      <h1 className="text-3xl font-bold text-navy-950 mb-8">আপনার কার্ট</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* বামদিক: কার্ট আইটেম লিস্ট */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="group relative flex flex-col sm:flex-row gap-4 rounded-2xl border border-beige-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              {/* ছবি */}
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-beige-50">
                <Image 
                  src={item.variant.product.images[0] ?? '/placeholder-product.jpg'} 
                  alt={item.variant.product.nameBn} 
                  fill 
                  className="object-cover transition-transform duration-300 group-hover:scale-105" 
                />
              </div>

              {/* বিস্তারিত */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <Link href={`/shop/${item.variant.product.slug}`} className="text-lg font-bold text-navy-950 hover:text-sea-600 transition-colors">
                      {item.variant.product.nameBn}
                    </Link>
                    {/* রিমুভ বাটন (মোবাইলে আইকন, ডেস্কটপে লেখা) */}
                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      <span className="hidden sm:inline">সরান</span>
                    </button>
                  </div>
                  <p className="text-sm text-navy-600 mt-1">সাইজ: {item.variant.label}</p>
                  <p className="text-sm font-semibold text-sea-700 mt-1">{formatTaka(Number(item.variant.price))} / পিস</p>
                </div>

                <div className="flex items-end justify-between mt-4">
                  {/* কোয়ান্টিটি কন্ট্রোল */}
                  <div className="flex items-center rounded-full border border-beige-300 bg-beige-50 p-1">
                    <button 
                      onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))} 
                      disabled={item.qty <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy-700 shadow-sm transition-colors hover:bg-sea-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-navy-900">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, Math.min(item.variant.stockQty, item.qty + 1))}
                      disabled={item.qty >= item.variant.stockQty}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy-700 shadow-sm transition-colors hover:bg-sea-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  {/* আইটেম সাবটোটাল */}
                  <p className="text-lg font-bold text-navy-950">{formatTaka(Number(item.variant.price) * item.qty)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ডানদিক: অর্ডার সামারি (ডেস্কটপে স্টিকি) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-beige-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-navy-950 border-b border-beige-100 pb-4">অর্ডার সামারি</h2>
            
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-navy-700">
                <span>সাবটোটাল ({items.reduce((s, i) => s + i.qty, 0)} পণ্য)</span>
                <span className="font-semibold text-navy-900">{formatTaka(subtotal)}</span>
              </div>
              <div className="flex justify-between text-navy-700">
                <span>ডেলিভারি চার্জ</span>
                <span className="text-xs text-navy-500 italic">চেকআউটে যোগ হবে</span>
              </div>
            </div>

            <div className="mt-6 border-t border-beige-200 pt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-navy-950">সর্বমোট</span>
                <span className="text-2xl font-extrabold text-sea-600">{formatTaka(subtotal)}</span>
              </div>
              
              <Link href="/checkout" className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg font-semibold">
                চেকআউট করুন
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              
              <Link href="/shop" className="mt-3 flex w-full items-center justify-center rounded-xl border border-beige-300 bg-white py-3 text-sm font-medium text-navy-700 transition-colors hover:bg-beige-50">
                কেনাকাটা চালিয়ে যান
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}