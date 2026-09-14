import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'গোপনীয়তা নীতি' };

export default function PrivacyPolicyPage() {
  return (
    <div className="container-app max-w-2xl py-10 text-navy-800">
      <h1 className="text-2xl font-bold text-navy-950">গোপনীয়তা নীতি</h1>

      <h2 className="mt-6 font-semibold text-navy-950">আমরা কী তথ্য সংগ্রহ করি</h2>
      <p className="mt-2">
        অর্ডার সম্পন্ন করতে আমরা শুধু প্রয়োজনীয় তথ্য সংগ্রহ করি: নাম, মোবাইল নাম্বার, এবং ডেলিভারি
        ঠিকানা। অপ্রয়োজনীয় ব্যক্তিগত তথ্য আমরা চাই না।
      </p>

      <h2 className="mt-6 font-semibold text-navy-950">তথ্য কীভাবে ব্যবহার করা হয়</h2>
      <p className="mt-2">আপনার তথ্য শুধুমাত্র অর্ডার প্রক্রিয়াকরণ, ডেলিভারি এবং গ্রাহক সেবার জন্য ব্যবহার করা হয়।</p>

      <h2 className="mt-6 font-semibold text-navy-950">রিভিউ ও তথ্য প্রদর্শন</h2>
      <p className="mt-2">
        রিভিউ প্রকাশের সময় আপনার নাম আংশিকভাবে গোপন রাখা হয় (যেমনঃ "রহিম H.")। সম্পূর্ণ নাম বা
        মোবাইল নাম্বার প্রকাশ্যে দেখানো হয় না।
      </p>

      <h2 className="mt-6 font-semibold text-navy-950">তথ্য সুরক্ষা</h2>
      <p className="mt-2">আপনার তথ্য নিরাপদে সংরক্ষণ করা হয় এবং তৃতীয় পক্ষের কাছে বিক্রি করা হয় না।</p>

      <p className="mt-6 text-sm text-navy-700">সর্বশেষ হালনাগাদ: এই টেমপ্লেট আইনি পরামর্শের বিকল্প নয় — প্রকাশের আগে একজন আইনজীবীর মাধ্যমে যাচাই করুন।</p>
    </div>
  );
}
