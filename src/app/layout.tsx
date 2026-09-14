import type { Metadata } from 'next';
import { Noto_Sans_Bengali, Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

const bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali'
});

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'শুঁটকি কর্নার | Shutki Corner — মানসম্মত শুঁটকি',
    template: '%s | Shutki Corner'
  },
  description: 'মানসম্মত শুঁটকি, যত্নসহকারে আপনার ঘরে। বাংলাদেশ জুড়ে ডেলিভারি।',
  openGraph: {
    title: 'Shutki Corner',
    description: 'মানসম্মত শুঁটকি, যত্নসহকারে আপনার ঘরে।',
    locale: 'bn_BD',
    type: 'website'
  },
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${bengali.variable} ${inter.variable}`}>
      <body className="font-bengali">
        <SiteHeader />
        <main className="pb-24 md:pb-0">{children}</main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
