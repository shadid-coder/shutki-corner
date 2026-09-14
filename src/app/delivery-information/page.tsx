import { prisma } from '@/lib/prisma';
import { formatTaka } from '@/lib/format';
import { DELIVERY_CONFIG } from '@/lib/config';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'ডেলিভারি তথ্য' };

export default async function DeliveryInfoPage() {
  const zones = await prisma.deliveryZone.findMany({ orderBy: { district: 'asc' } });

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-navy-950">ডেলিভারি তথ্য</h1>
      <p className="mt-2 text-navy-800">আমরা সারা বাংলাদেশে ডেলিভারি করি। আনুমানিক সময়: ২-৪ কর্মদিবস (এলাকাভেদে ভিন্ন হতে পারে)।</p>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-beige-200 text-navy-700">
            <th className="py-2">জেলা</th>
            <th className="py-2">এলাকা/উপজেলা</th>
            <th className="py-2">ডেলিভারি চার্জ</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.id} className="border-b border-beige-100">
              <td className="py-2">{z.district}</td>
              <td className="py-2">{z.upazila ?? 'সব এলাকা'}</td>
              <td className="py-2">{formatTaka(Number(z.charge))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      
    </div>
  );
}
