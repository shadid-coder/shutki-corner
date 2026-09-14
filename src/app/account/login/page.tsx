'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(''); // 👈 নামের স্টেট
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name }) // 👈 এখানে name পাঠানো হচ্ছে
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) return setError(body.error);
    
    if (body.demoOtp) {
      setDemoOtp(body.demoOtp);
    }
    
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
    router.refresh(); 
    router.push('/account');
  }

  return (
    <div className="container-app max-w-sm py-12">
      <h1 className="text-2xl font-bold text-navy-950">লগইন করুন</h1>
      <p className="mt-1 text-sm text-navy-700">
        লগইন ছাড়াও{' '}
        <a href="/checkout" className="text-sea-600 underline">
          গেস্ট হিসেবে অর্ডার করতে পারেন
        </a>
        ।
      </p>

      {step === 'phone' ? (
        <form onSubmit={requestOtp} className="mt-6 space-y-4">
          {/* 👇 নতুন নামের ইনপুট ফিল্ড */}
          <div>
            <label htmlFor="name" className="text-sm font-medium text-navy-800">
              আপনার নাম (নতুন হলে লিখুন)
            </label>
            <input 
              id="name" 
              placeholder="যেমন: ফিরোজ শাহাদাত" 
              className="input-field mt-1" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium text-navy-800">
              মোবাইল নাম্বার
            </label>
            <input 
              id="phone" 
              required 
              placeholder="01XXXXXXXXX" 
              className="input-field mt-1" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'পাঠানো হচ্ছে...' : 'কোড পাঠান'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-6 space-y-3">
          <label htmlFor="code" className="text-sm font-medium text-navy-800">
            {phone} নাম্বারে পাঠানো ৬ সংখ্যার কোড দিন
          </label>

          {demoOtp && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center shadow-sm">
              <p className="text-xs text-amber-800 font-medium">ডেমো মোড: আপনার OTP কোড</p>
              <p className="text-3xl font-bold text-amber-900 tracking-[0.2em] my-2">{demoOtp}</p>
              <p className="text-xs text-amber-600">(আসল SMS গেটওয়ে চালু হলে এই বক্সটি আর দেখা যাবে না)</p>
            </div>
          )}

          <input 
            id="code" 
            required 
            maxLength={6} 
            className="input-field text-center text-xl tracking-[0.5em] font-bold" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            placeholder="------"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
          </button>
        </form>
      )}
    </div>
  );
}