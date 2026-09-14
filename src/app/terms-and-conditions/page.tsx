import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'শর্তাবলী' };

export default function TermsPage() {
  return (
    <div className="container-app max-w-2xl py-10 text-navy-800">
      <h1 className="text-2xl font-bold text-navy-950">শর্তাবলী</h1>

      <h2 className="mt-6 font-semibold text-navy-950">অর্ডার</h2>
      <p className="mt-2">অর্ডার নিশ্চিত করার আগে দয়া করে পণ্যের নাম, পরিমাণ ও ডেলিভারি ঠিকানা যাচাই করে নিন।</p>

      <h2 className="mt-6 font-semibold text-navy-950">পেমেন্ট</h2>
      <p className="mt-2">বর্তমানে শুধু ক্যাশ অন ডেলিভারি এবং বিকাশ/নগদ ম্যানুয়াল পেমেন্ট সুবিধা চালু আছে।</p>

      <h2 className="mt-6 font-semibold text-navy-950">রিভিউ নীতি</h2>
      <p className="mt-2">
        শুধুমাত্র যাচাইকৃত ক্রেতারা রিভিউ দিতে পারবেন। ভুয়া, আপত্তিকর বা অপ্রাসঙ্গিক রিভিউ মডারেশনের
        মাধ্যমে সরিয়ে ফেলা হতে পারে। আমরা নেতিবাচক রিভিউ লুকাই না।
      </p>

      <h2 className="mt-6 font-semibold text-navy-950">মূল্য পরিবর্তন</h2>
      <p className="mt-2">পণ্যের মূল্য পূর্ব নোটিশ ছাড়াই পরিবর্তিত হতে পারে, তবে অর্ডার নিশ্চিত হওয়ার সময়ের মূল্যই কার্যকর থাকবে।</p>

      <p className="mt-6 text-sm text-navy-700">এই টেমপ্লেট আইনি পরামর্শের বিকল্প নয় — প্রকাশের আগে একজন আইনজীবীর মাধ্যমে যাচাই করুন।</p>
    </div>
  );
}
