import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/account/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  return (
    <div className="container-app py-10 max-w-4xl mx-auto min-h-[70vh]">
      <h1 className="text-3xl font-bold text-navy-950 mb-8">আমার অ্যাকাউন্ট</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* বামদিক: প্রোফাইল কার্ড */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-beige-200 shadow-sm flex flex-col items-center text-center">
          <div className="h-24 w-24 bg-sea-50 rounded-full flex items-center justify-center text-4xl mb-4 border-2 border-sea-100">
            👤
          </div>
          <h2 className="text-xl font-bold text-navy-950">{user?.name ?? 'নাম যোগ করা হয়নি'}</h2>
          <p className="text-navy-600 mt-1 font-medium">{user?.phone}</p>
          
          <div className="mt-6 w-full pt-6 border-t border-beige-100">
             <p className="text-xs text-navy-500">অ্যাকাউন্ট তৈরি: {new Date(user?.createdAt || '').toLocaleDateString('bn-BD', { year: 'numeric', month: 'long' })}</p>
          </div>
        </div>


{/* 👇 অ্যাডমিনদের জন্য বিশেষ বাটন */}
{session.role === 'ADMIN' && (
  <Link href="/admin" className="block bg-navy-900 text-white p-5 rounded-2xl shadow-sm hover:bg-navy-950 transition-all group hover:-translate-y-0.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
         <div className="bg-white/20 p-3 rounded-xl text-2xl">👑</div>
         <div>
           <h3 className="font-semibold text-lg">অ্যাডমিন প্যানেল</h3>
           <p className="text-sm text-white/80 mt-0.5">ড্যাশবোর্ডে যান এবং অর্ডার ম্যানেজ করুন</p>
         </div>
      </div>
      <span className="text-white/60 group-hover:text-white transition-colors text-xl">→</span>
    </div>
  </Link>
)}
{/* 👆 অ্যাডমিন বাটন শেষ */}


        {/* ডানদিক: নেভিগেশন লিংক ও অ্যাকশন */}
        <div className="md:col-span-2 space-y-4">
          
          <Link href="/account/orders" className="block bg-white p-5 rounded-2xl border border-beige-200 shadow-sm hover:border-sea-300 transition-all group hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="bg-beige-50 p-3 rounded-xl text-2xl group-hover:bg-sea-50 transition-colors">📦</div>
                 <div>
                   <h3 className="font-semibold text-navy-950 text-lg">আমার অর্ডার</h3>
                   <p className="text-sm text-navy-600 mt-0.5">আপনার অর্ডারসমূহের অবস্থা ও ইতিহাস দেখুন</p>
                 </div>
              </div>
              <span className="text-navy-400 group-hover:text-sea-600 transition-colors text-xl">→</span>
            </div>
          </Link>

          {/* লগআউট সেকশন */}
          <div className="block bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="flex items-center justify-between w-full text-left group">
                  <div className="flex items-center gap-4">
                     <div className="bg-red-50 p-3 rounded-xl text-2xl">🚪</div>
                     <div>
                       <h3 className="font-semibold text-red-600 text-lg">লগআউট</h3>
                       <p className="text-sm text-navy-600 mt-0.5">নিরাপদে আপনার অ্যাকাউন্ট থেকে বেরিয়ে যান</p>
                     </div>
                  </div>
                  <span className="text-navy-400 group-hover:text-red-500 transition-colors text-xl">→</span>
                </button>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
}