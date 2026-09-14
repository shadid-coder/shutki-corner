import Link from 'next/link';

const items = [
  { href: '/', label: 'হোম', icon: '🏠' },
  { href: '/shop', label: 'শপ', icon: '🛍️' },
  { href: '/cart', label: 'কার্ট', icon: '🛒' },
  { href: '/account/orders', label: 'অর্ডার', icon: '📦' },
  { href: '/account', label: 'অ্যাকাউন্ট', icon: '👤' }
];

export default function BottomNav() {
  return (
    <nav
      aria-label="প্রধান নেভিগেশন"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-beige-200 bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="flex items-stretch justify-between">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-2.5 text-xs text-navy-900 focus-visible:bg-beige-100"
            >
              <span aria-hidden className="text-lg">
                {item.icon}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
