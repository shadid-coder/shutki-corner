import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-beige-200 bg-white mt-12">
      <div className="container-app py-10 pb-28 md:pb-10 text-sm">
        
        {/* মেইন ফুটার গ্রিড */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center sm:text-left">
          
          <div>
            <p className="font-semibold text-navy-950 text-lg">শুঁটকি কর্নার</p>
            <p className="mt-2 text-navy-700 leading-relaxed">
              মানসম্মত শুঁটকি, যত্নসহকারে আপনার ঘরে।
            </p>
          </div>
          
          <div className="flex flex-col gap-2 items-center sm:items-start">
            <Link href="/faq" className="text-navy-700 hover:text-sea-600 transition-colors">প্রশ্নোত্তর</Link>
            <Link href="/privacy-policy" className="text-navy-700 hover:text-sea-600 transition-colors">গোপনীয়তা নীতি</Link>
            <Link href="/terms-and-conditions" className="text-navy-700 hover:text-sea-600 transition-colors">শর্তাবলী</Link>
          </div>
          
          <div className="flex flex-col gap-2 items-center sm:items-start">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-navy-700 hover:text-sea-600 transition-colors">Instagram</a>
            <a href="https://www.facebook.com/share/1Tk526qRY7/" target="_blank" rel="noopener noreferrer" className="text-navy-700 hover:text-sea-600 transition-colors">Facebook</a>
          </div>
        </div>

        {/* 👇 কপিরাইট ও ডেভেলপার ক্রেডিট সেকশন */}
        <div className="mt-8 border-t border-beige-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-navy-500">
          <p>© {new Date().getFullYear()} শুঁটকি কর্নার। সর্বস্বত্ব সংরক্ষিত।</p>
          
          {/* ⚠️ আপনার নাম ও ইমেইল এখানে বসানো হলো */}
          <p className="flex items-center gap-1 flex-wrap justify-center">
            Developed by 
            <span className="font-semibold text-navy-800">it_shadid</span>
            <span className="text-navy-300">|</span>
            <a href="mailto:shadid2023@gmail.com" className="text-sea-600 hover:underline font-medium">
              shadid2023@gmail.com
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}