import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const zones = await prisma.deliveryZone.findMany({
      orderBy: [{ district: 'asc' }, { upazila: 'asc' }]
    });
    return NextResponse.json({ zones });
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}