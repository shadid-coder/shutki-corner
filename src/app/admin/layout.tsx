import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const links = [
    { href: '/admin', label: 'ওভারভিউ' },
    { href: '/admin/products', label: 'পণ্য' },
    { href: '/admin/orders', label: 'অর্ডার' },
    { href: '/admin/reviews', label: 'রিভিউ' },
    { href: '/admin/delivery-zones', label: 'ডেলিভারি চার্জ' }
  ];

  return (
    <div className="min-h-screen bg-beige-50">
      <div className="border-b border-beige-200 bg-navy-950 text-white">
        <div className="container-app flex h-14 items-center justify-between">
          <span className="font-semibold">শুঁটকি কর্নার — অ্যাডমিন</span>
          <form action="/api/auth/logout" method="post">
            <button className="text-sm text-sea-100 underline">লগআউট</button>
          </form>
        </div>
      </div>
      <div className="container-app flex gap-6 py-6">
        <nav className="w-40 shrink-0 space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm text-navy-900 hover:bg-beige-100">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
