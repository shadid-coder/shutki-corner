import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'প্রশ্নোত্তর' };

interface FaqItem {
  q: string;
  a: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  { q: 'ডেলিভারি পেতে কত সময় লাগে?', a: 'সাধারণত ২-৪ কর্মদিবস, এলাকাভেদে ভিন্ন হতে পারে।' },
  { q: 'পেমেন্ট পদ্ধতি কী কী?', a: 'বর্তমানে শুধু ক্যাশ অন ডেলিভারি চালু আছে। bKash/Nagad শীঘ্রই যুক্ত হবে।' },
  { q: 'পণ্য ফেরত দেওয়া যাবে কি?', a: 'পণ্যে সমস্যা থাকলে ডেলিভারির সময় বা তার অল্প সময়ের মধ্যেই আমাদের জানান, আমরা সমাধানের চেষ্টা করব।' },
  { q: 'আমি কীভাবে রিভিউ দিতে পারি?', a: 'অর্ডার ডেলিভার হওয়ার পর "আমার অর্ডার" পাতা থেকে রিভিউ দেওয়া যাবে।' }
];

export default async function FaqPage() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'faq' } });
  const faqs = (setting?.value as unknown as FaqItem[] | undefined) ?? DEFAULT_FAQS;

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-navy-950">প্রশ্নোত্তর</h1>
      <div className="mt-6 space-y-4">
        {faqs.map((f) => (
          <details key={f.q} className="card">
            <summary className="cursor-pointer font-medium text-navy-950">{f.q}</summary>
            <p className="mt-2 text-navy-800">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
