import { prisma } from './prisma';
import { DELIVERY_CONFIG } from './config';

export async function getDeliveryCharge(district: string, upazila: string): Promise<number> {
  const exact = await prisma.deliveryZone.findFirst({ where: { district, upazila } });
  if (exact) return Number(exact.charge);

  const districtLevel = await prisma.deliveryZone.findFirst({ where: { district, upazila: null } });
  if (districtLevel) return Number(districtLevel.charge);

  return DELIVERY_CONFIG.fallbackChargeTaka;
}
