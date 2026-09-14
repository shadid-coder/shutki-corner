'use client';

import { useEffect, useState } from 'react';

interface Zone {
  id: string;
  district: string;
  upazila: string | null;
  charge: string;
}

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCharge, setNewCharge] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/admin/delivery-zones');
      const data = await res.json();
      if (res.ok) setZones(data.zones || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (zone: Zone) => {
    setEditingId(zone.id);
    setNewCharge(zone.charge);
    setMessage('');
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/delivery-zones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charge: newCharge })
      });
      const data = await res.json();
      
      if (res.ok) {
        setZones(zones.map(z => z.id === id ? { ...z, charge: data.zone.charge } : z));
        setEditingId(null);
        setMessage('✅ চার্জ সফলভাবে আপডেট হয়েছে!');
      } else {
        setMessage('❌ আপডেট করা যায়নি: ' + data.error);
      }
    } catch (err) {
      setMessage('❌ একটি সমস্যা হয়েছে।');
    }
  };

  if (loading) return <div className="p-8 text-center">লোড হচ্ছে...</div>;

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-navy-950 mb-6">🚚 ডেলিভারি চার্জ ম্যানেজমেন্ট</h1>
      
      {message && <div className="mb-4 p-3 bg-beige-100 rounded text-sm">{message}</div>}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-beige-100 text-navy-800">
            <tr>
              <th className="p-4 font-semibold">জেলা</th>
              <th className="p-4 font-semibold">উপজেলা / এলাকা</th>
              <th className="p-4 font-semibold">চার্জ (৳)</th>
              <th className="p-4 font-semibold">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige-200">
            {zones.map((zone) => (
              <tr key={zone.id} className="hover:bg-beige-50">
                <td className="p-4 font-medium text-navy-950">{zone.district}</td>
                <td className="p-4 text-navy-700">{zone.upazila || 'সব এলাকা'}</td>
                <td className="p-4 font-semibold text-navy-900">
                  {editingId === zone.id ? (
                    <input
                      type="number"
                      className="input-field w-24 py-1 px-2"
                      value={newCharge}
                      onChange={(e) => setNewCharge(e.target.value)}
                    />
                  ) : (
                    `৳ ${zone.charge}`
                  )}
                </td>
                <td className="p-4">
                  {editingId === zone.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(zone.id)} className="btn-primary py-1 px-3 text-xs">সেভ</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary py-1 px-3 text-xs border rounded">বাতিল</button>
                    </div>
                  ) : (
                    <button onClick={() => handleEditClick(zone)} className="text-sea-600 hover:underline text-xs font-medium">এডিট করুন</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}