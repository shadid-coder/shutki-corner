import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const zones = await prisma.deliveryZone.findMany({
    orderBy: { district: 'asc' }
  });
  return NextResponse.json({ zones });
}