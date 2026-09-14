import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ১. অ্যাডমিন কিনা চেক করা
    await requireAdmin();
    
    // ২. রিকোয়েস্ট বডি থেকে নতুন চার্জ নেওয়া
    const body = await req.json();
    const { charge } = body;

    if (charge === undefined || isNaN(Number(charge))) {
      return NextResponse.json({ error: 'সঠিক চার্জ দিন' }, { status: 400 });
    }

    // ৩. ডেটাবেসে চার্জ আপডেট করা
    const updated = await prisma.deliveryZone.update({
      where: { id: params.id },
      data: { charge: Number(charge) }
    });

    return NextResponse.json({ zone: updated });
  } catch (error: any) {
    console.error("PUT Delivery Zone Error:", error.message);
    return NextResponse.json({ error: 'আপডেট করা যায়নি' }, { status: 500 });
  }
}