'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { OrderStatus } from '@prisma/client';

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const admin = await requireAdmin();
  const before = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  // Only stamp deliveredAt the first time an order becomes DELIVERED —
  // re-saving the same status (or moving away and back) must not reset
  // the review-reminder clock.
  const justDelivered = status === 'DELIVERED' && before.status !== 'DELIVERED';

  const after = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(justDelivered ? { deliveredAt: new Date() } : {})
    }
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.userId,
      action: 'order:status_change',
      entity: 'Order',
      entityId: orderId,
      beforeJson: { status: before.status },
      afterJson: { status: after.status }
    }
  });

  if (justDelivered) {
    await prisma.notification.create({
      data: { userId: after.userId, type: 'REVIEW_REQUEST', payload: { orderId, orderNumber: after.orderNumber } }
    });
  }

  revalidatePath('/admin/orders');
}
