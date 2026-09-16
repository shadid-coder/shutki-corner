'use client';

import { useState } from 'react';

export default function ImageUpload({ initialUrl = '' }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'আপলোড করা যায়নি');
      
      setUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-navy-800">পণ্যের ছবি</label>
      
      {/* এই হিডেন ইনপুটটা ব্যাকএন্ডে URL পাঠাবে */}
      <input type="hidden" name="imageUrl" value={url} />
      
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload} 
        className="input-field" 
      />
      
      {uploading && <p className="text-sm text-sea-600">আপলোড হচ্ছে, একটু অপেক্ষা করুন...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      {url && (
        <div className="mt-3">
          <p className="text-xs text-navy-600 mb-1">ছবির প্রিভিউ:</p>
          <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-beige-200">
            <img src={url} alt="Preview" className="object-cover w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}