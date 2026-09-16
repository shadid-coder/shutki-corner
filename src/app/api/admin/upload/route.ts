import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // ১. শুধু অ্যাডমিন ছবি আপলোড করতে পারবে
    await requireAdmin();

    // ২. ফাইল রিসিভ করা
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'কোনো ফাইল পাওয়া যায়নি' }, { status: 400 });

    // ৩. Supabase ক্লায়েন্ট তৈরি
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ৪. ফাইলের নাম জেনারেট করা (যাতে একই নামে ফাইল ওভাররাইট না হয়)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // ৫. Supabase Storage-এ আপলোড করা (product-images বাকেটে)
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, buffer, { contentType: file.type });

    if (error) throw error;

    // ৬. পাবলিক URL বের করা
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}