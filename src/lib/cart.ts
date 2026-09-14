import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { prisma } from './prisma';
import { getSession } from './auth';

const GUEST_CART_COOKIE = 'sc_cart_session';

/** Finds or creates the cart for the current visitor — the logged-in
 * user's cart if authenticated, otherwise a guest cart keyed by a cookie. */
export async function getOrCreateCart() {
  const session = await getSession();

  if (session) {
    const existing = await prisma.cart.findUnique({ where: { userId: session.userId } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId: session.userId } });
  }

  const store = cookies();
  let sessionId = store.get(GUEST_CART_COOKIE)?.value;
  if (!sessionId) {
    sessionId = nanoid();
    store.set(GUEST_CART_COOKIE, sessionId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 60 });
  }

  const existing = await prisma.cart.findUnique({ where: { sessionId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { sessionId } });
}

export async function getCartWithItems() {
  const cart = await getOrCreateCart();
  return prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: { items: { include: { variant: { include: { product: true } } } } }
  });
}
