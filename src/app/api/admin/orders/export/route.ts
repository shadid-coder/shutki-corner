import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'অননুমোদিত' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: { user: true, address: true, items: true },
    orderBy: { createdAt: 'desc' }
  });

  const header = ['Order Number', 'Date', 'Customer', 'Phone', 'District', 'Upazila', 'Status', 'Payment Method', 'Subtotal', 'Delivery Charge', 'Total'];
  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt.toISOString(),
    o.user.name ?? '',
    o.user.phone,
    o.address.district,
    o.address.upazila,
    o.status,
    o.paymentMethod,
    o.subtotal.toString(),
    o.deliveryCharge.toString(),
    o.total.toString()
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}