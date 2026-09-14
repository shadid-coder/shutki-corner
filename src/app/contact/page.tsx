'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '+8801XXXXXXXXX';
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '8801XXXXXXXXX';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error);
      setStatus('error');
      return;
    }
    setStatus('done');
  }

  return (
    <div className="container-app max-w-lg py-10">
      <h1 className="text-2xl font-bold text-navy-950">যোগাযোগ করুন</h1>
      <p className="mt-2 text-navy-700">
        সরাসরি{' '}
        <a href={`tel:${phone}`} className="text-sea-600 underline">
          কল করুন
        </a>{' '}
        অথবা{' '}
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-sea-600 underline">
          হোয়াটসঅ্যাপে
        </a>{' '}
        মেসেজ দিন, অথবা নিচের ফর্ম পূরণ করুন।
      </p>

      {status === 'done' ? (
        <p className="mt-6 text-sea-600">আপনার বার্তা পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input required placeholder="আপনার নাম" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="মোবাইল নাম্বার" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <textarea required placeholder="আপনার বার্তা" rows={4} className="input-field" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading' ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}
          </button>
        </form>
      )}
    </div>
  );
}
