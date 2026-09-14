'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) return setError(body.error);
    setStep('code');
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) return setError(body.error);

    // The verify endpoint logs in any phone number; role is checked
    // server-side on every admin page load via requireAdmin/AdminLayout,
    // so a non-admin who signs in here is simply redirected back out.
    router.push('/admin');
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-navy-950">অ্যাডমিন লগইন</h1>
      {step === 'phone' ? (
        <form onSubmit={requestOtp} className="mt-6 space-y-3">
          <input required placeholder="অ্যাডমিন মোবাইল নাম্বার" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            কোড পাঠান
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-6 space-y-3">
          <input required maxLength={6} placeholder="৬ সংখ্যার কোড" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            যাচাই করুন
          </button>
        </form>
      )}
    </div>
  );
}
