import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/auth';


export default async function SiteHeader() {
  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '+8801XXXXXXXXX';
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '8801XXXXXXXXX';
  
  // ইউজার লগইন করা আছে কি না চেক করছি
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 border-b border-beige-200 bg-beige-50/95 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="শুঁটকি কর্নার" width={40} height={40} className="h-10 w-10 rounded-full object-cover border-beige-200 bg-white shadow-sm" />
          <span className="text-xl font-bold text-navy-950">শুঁটকি কর্নার</span>
          <span className="hidden text-sm text-navy-700 sm:inline">Shutki Corner</span>
        </Link>

        <nav aria-label="প্রধান মেনু" className="hidden items-center gap-6 md:flex">
          <Link href="/shop" className="text-navy-900 hover:text-sea-600">পণ্য দেখুন</Link>
          <Link href="/about" className="text-navy-900 hover:text-sea-600">আমাদের সম্পর্কে</Link>
          <Link href="/delivery-information" className="text-navy-900 hover:text-sea-600">ডেলিভারি তথ্য</Link>
          <Link href="/contact" className="text-navy-900 hover:text-sea-600">যোগাযোগ</Link>
        </nav>

        <div className="flex items-center gap-2">
          <a href={`tel:${phone}`} aria-label="কল করুন" className="rounded-full border border-navy-800 p-2.5 text-navy-900 hover:bg-beige-100">📞</a>
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="হোয়াটসঅ্যাপে যোগাযোগ করুন" className="rounded-full border border-navy-800 p-2.5 text-navy-900 hover:bg-beige-100">💬</a>
          <Link href="/cart" className="hidden rounded-full border border-navy-800 p-2.5 text-navy-900 hover:bg-beige-100 sm:inline-flex" aria-label="কার্ট">🛒</Link>

          {/* ⬇️ এখানে লগইন কন্ডিশন বসানো হয়েছে ⬇️ */}
          {session ? (
            <div className="flex items-center gap-2">
              <Link href="/account" className="hidden text-sm font-medium text-navy-900 hover:text-sea-600 sm:inline-block">
                আমার অ্যাকাউন্ট
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="rounded-full border border-navy-800 p-2.5 text-navy-900 hover:bg-beige-100" aria-label="লগআউট">
                  🚪
                </button>
              </form>
            </div>
          ) : (
            <Link href="/account/login" className="rounded-full border border-navy-800 p-2.5 text-navy-900 hover:bg-beige-100" aria-label="লগইন">
              👤
            </Link>
          )}
          {/* ⬆️ কন্ডিশন শেষ ⬆️ */}

        </div>
      </div>
    </header>
  );
}