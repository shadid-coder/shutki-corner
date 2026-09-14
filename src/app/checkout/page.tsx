'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatTaka } from '@/lib/format';

interface CartItem {
  id: string;
  qty: number;
  variant: { id: string; label: string; price: string; product: { nameBn: string } };
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    district: '',
    upazila: '',
    landmark: '',
    deliveryNote: '',
    contactMethod: 'call' as 'call' | 'whatsapp' | 'sms',
    paymentMethod: 'COD' as 'COD' | 'MANUAL_BKASH' | 'MANUAL_NAGAD',
    agreedToTerms: false,
    trxId: '',
    senderPhone: '' // 👈 এখানে বানানটা ঠিক করা হয়েছে
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionPhone, setSessionPhone] = useState<string | null>(null);

  // কার্ট লোড করা
  useEffect(() => {
    fetch('/api/cart')
      .then((r) => r.json())
      .then((cart) => setItems(cart.items ?? []));
  }, []);

  // ইউজার সেশন চেক করা
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.phone) {
          setSessionPhone(data.user.phone);
          setForm((prev) => ({ ...prev, phone: data.user.phone }));
        }
      })
      .catch(() => {});
  }, []);

  // ডেলিভারি জোন লোড করা
  useEffect(() => {
    fetch('/api/delivery-zones', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setDeliveryZones(data.zones || []))
      .catch((err) => console.error('Error fetching zones:', err));
  }, []);

  const idempotencyKey = useMemo(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`, []);
  const subtotal = items.reduce((sum, i) => sum + Number(i.variant.price) * i.qty, 0);

  // জেলা এবং উপজেলার ডায়নামিক লিস্ট তৈরি
  const availableDistricts = Array.from(new Set(deliveryZones.map((z) => z.district)));
  
  const availableUpazilas = deliveryZones
    .filter((z) => z.district === form.district && z.upazila !== null && z.upazila !== '' && z.upazila !== 'All')
    .map((z) => z.upazila);

  // ডেলিভারি চার্জ এবং সর্বমোট দাম হিসাব
  const selectedZone = 
    deliveryZones.find((z) => z.district === form.district && z.upazila === form.upazila) ||
    deliveryZones.find((z) => z.district === form.district && (z.upazila === 'All' || z.upazila === '' || z.upazila === null));
  
  const deliveryCharge = selectedZone ? Number(selectedZone.charge) : 0;
  const grandTotal = subtotal + deliveryCharge;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.agreedToTerms) {
      setError('চালিয়ে যেতে শর্তাবলী মেনে নিতে হবে');
      return;
    }
    if (items.length === 0) {
      setError('আপনার কার্ট খালি');
      return;
    }
    if (!selectedZone) {
      setError('আপনার এলাকার ডেলিভারি চার্জ পাওয়া যায়নি, অনুগ্রহ করে সঠিক এলাকা নির্বাচন করুন');
      return;
    }
    // বিকাশ/নগদ সিলেক্ট করলে TrxID চেক করা
    if ((form.paymentMethod === 'MANUAL_BKASH' || form.paymentMethod === 'MANUAL_NAGAD') && (!form.trxId || !form.senderPhone)) {
      setError('অনুগ্রহ করে ট্রানজেকশন আইডি এবং আপনার নাম্বার দিন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deliveryCharge: deliveryCharge,
          idempotencyKey,
          items: items.map((i) => ({ variantId: i.variant.id, qty: i.qty }))
        })
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'অর্ডার সম্পন্ন করা যায়নি');
        setSubmitting(false);
        return;
      }
      router.push(`/order-confirmation/${body.orderId}`);
    } catch {
      setError('একটি সমস্যা হয়েছে, আবার চেষ্টা করুন');
      setSubmitting(false);
    }
  }

  return (
    <div className="container-app py-6">
      <h1 className="text-2xl font-bold text-navy-950">চেকআউট</h1>

      <form onSubmit={submit} className="mt-6 grid gap-8 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-navy-800">পূর্ণ নাম</label>
            <input id="name" required className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium text-navy-800">মোবাইল নাম্বার</label>
            <input
              id="phone"
              required
              placeholder="01XXXXXXXXX"
              className={`input-field mt-1 ${sessionPhone ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              readOnly={!!sessionPhone}
            />
            {sessionPhone && (
              <p className="mt-1 text-xs text-green-600">✅ আপনি লগইন করা আছেন। এই নাম্বারে অর্ডারটি যুক্ত হবে।</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="district" className="text-sm font-medium text-navy-800">জেলা *</label>
              <select
                id="district"
                required
                className="input-field mt-1"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value, upazila: '' })}
              >
                <option value="">নির্বাচন করুন</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="upazila" className="text-sm font-medium text-navy-800">এলাকা/উপজেলা *</label>
              {availableUpazilas.length > 0 ? (
                <select
                  id="upazila"
                  required
                  className="input-field mt-1"
                  value={form.upazila}
                  onChange={(e) => setForm({ ...form, upazila: e.target.value })}
                >
                  <option value="">নির্বাচন করুন</option>
                  {availableUpazilas.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              ) : (
                <input 
                  id="upazila" 
                  required 
                  placeholder="আপনার এলাকার নাম লিখুন"
                  className="input-field mt-1" 
                  value={form.upazila} 
                  onChange={(e) => setForm({ ...form, upazila: e.target.value })} 
                />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="landmark" className="text-sm font-medium text-navy-800">ল্যান্ডমার্ক (ঐচ্ছিক)</label>
            <input id="landmark" className="input-field mt-1" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
          </div>

          <div>
            <label htmlFor="deliveryNote" className="text-sm font-medium text-navy-800">ডেলিভারি নোট (ঐচ্ছিক)</label>
            <textarea id="deliveryNote" className="input-field mt-1" value={form.deliveryNote} onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })} />
          </div>

          <div>
            <p className="text-sm font-medium text-navy-800">যোগাযোগের পছন্দের মাধ্যম</p>
            <div className="mt-1 flex gap-3">
              {(['call', 'whatsapp', 'sms'] as const).map((m) => (
                <label key={m} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="contactMethod" checked={form.contactMethod === m} onChange={() => setForm({ ...form, contactMethod: m })} />
                  {m === 'call' ? 'কল' : m === 'whatsapp' ? 'হোয়াটসঅ্যাপ' : 'এসএমএস'}
                </label>
              ))}
            </div>
          </div>

          {/* পেমেন্ট পদ্ধতি - এখানে নতুন কোড বসানো হয়েছে */}
          <div>
            <p className="text-sm font-medium text-navy-800 mb-2">পেমেন্ট পদ্ধতি</p>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${form.paymentMethod === 'COD' ? 'border-sea-500 bg-sea-50' : 'border-beige-200'}`}>
                <input type="radio" className="mt-1" name="paymentMethod" checked={form.paymentMethod === 'COD'} onChange={() => setForm({ ...form, paymentMethod: 'COD', trxId: '', senderPhone: '' })} />
                <div>
                  <p className="font-semibold text-navy-950">ক্যাশ অন ডেলিভারি</p>
                  <p className="text-xs text-navy-600 mt-0.5">পণ্য হাতে পেয়ে টাকা পরিশোধ করুন</p>
                </div>
              </label>
              
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${form.paymentMethod === 'MANUAL_BKASH' ? 'border-sea-500 bg-sea-50' : 'border-beige-200'}`}>
                <input type="radio" className="mt-1" name="paymentMethod" checked={form.paymentMethod === 'MANUAL_BKASH'} onChange={() => setForm({ ...form, paymentMethod: 'MANUAL_BKASH' })} />
                <div className="flex-1">
                  <p className="font-semibold text-navy-950">বিকাশ (bKash)</p>
                  <p className="text-xs text-navy-600 mt-0.5">ম্যানুয়াল পেমেন্ট (সেন্ড মানি)</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${form.paymentMethod === 'MANUAL_NAGAD' ? 'border-sea-500 bg-sea-50' : 'border-beige-200'}`}>
                <input type="radio" className="mt-1" name="paymentMethod" checked={form.paymentMethod === 'MANUAL_NAGAD'} onChange={() => setForm({ ...form, paymentMethod: 'MANUAL_NAGAD' })} />
                <div className="flex-1">
                  <p className="font-semibold text-navy-950">নগদ (Nagad)</p>
                  <p className="text-xs text-navy-600 mt-0.5">ম্যানুয়াল পেমেন্ট (সেন্ড মানি)</p>
                </div>
              </label>
            </div>

            {/* বিকাশ/নগদ সিলেক্ট করলে এই অংশটা দেখাবে */}
            {(form.paymentMethod === 'MANUAL_BKASH' || form.paymentMethod === 'MANUAL_NAGAD') && (
              <div className="mt-4 p-4 border border-dashed border-sea-300 bg-sea-50/50 rounded-xl space-y-4">
                <div className="text-sm text-navy-800">
                  <p className="font-semibold text-sea-700 mb-1">
                    {form.paymentMethod === 'MANUAL_BKASH' ? 'বিকাশ' : 'নগদ'} পেমেন্ট নির্দেশনা:
                  </p>
                  <p>অনুগ্রহ করে নিচের নাম্বারে <strong>সেন্ড মানি</strong> করুন:</p>
                  {/* ⚠️ নিচের নাম্বারটি আপনার নিজের বিকাশ/নগদ নাম্বার দিয়ে পরিবর্তন করুন */}
                  <p className="text-lg font-bold text-navy-950 mt-1">📱 017XXXXXXXX</p> 
                  <p className="text-xs text-navy-500 mt-1">টাকা পাঠানোর পর নিচের তথ্যগুলো পূরণ করুন।</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-navy-800 mb-1">আপনার নাম্বার *</label>
                    <input required className="input-field w-full text-sm" placeholder="যে নাম্বার থেকে পাঠিয়েছেন" value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-800 mb-1">ট্রানজেকশন আইডি (TrxID) *</label>
                    <input required className="input-field w-full text-sm" placeholder="যেমন: 8N7A6D5F4G" value={form.trxId} onChange={(e) => setForm({ ...form, trxId: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card h-fit space-y-3">
          <h2 className="font-semibold text-navy-950">অর্ডার সামারি</h2>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span>{i.variant.product.nameBn} ({i.variant.label}) × {i.qty}</span>
              <span>{formatTaka(Number(i.variant.price) * i.qty)}</span>
            </div>
          ))}
          
          <div className="flex justify-between text-sm text-navy-700 border-t border-beige-200 pt-2">
            <span>ডেলিভারি চার্জ</span>
            <span>{deliveryCharge > 0 ? formatTaka(deliveryCharge) : 'জেলা নির্বাচন করুন'}</span>
          </div>

          <div className="flex justify-between font-bold text-navy-950 border-t border-beige-200 pt-2">
            <span>সর্বমোট</span>
            <span>{formatTaka(grandTotal)}</span>
          </div>

          <label className="flex items-start gap-2 text-xs text-navy-700 pt-2">
            <input type="checkbox" checked={form.agreedToTerms} onChange={(e) => setForm({ ...form, agreedToTerms: e.target.checked })} className="mt-0.5" />
            আমি <a href="/terms-and-conditions" className="underline">শর্তাবলী</a> মেনে নিচ্ছি
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'অর্ডার হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}
          </button>
        </div>
      </form>
    </div>
  );
}