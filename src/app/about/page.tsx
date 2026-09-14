import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'আমাদের সম্পর্কে' };

export default function AboutPage() {
  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-navy-950">আমাদের সম্পর্কে</h1>
      <p className="mt-4 text-navy-800">
        শুঁটকি কর্নার একটি অনলাইন শুঁটকি বিক্রেতা প্রতিষ্ঠান, যারা মানসম্মত ও পরিষ্কার-পরিচ্ছন্নভাবে
        প্রস্তুতকৃত শুঁটকি সরাসরি ক্রেতার ঘরে পৌঁছে দেওয়ার চেষ্টা করে।
      </p>
      <p className="mt-4 text-navy-800">
        আমরা প্রতিটি পণ্য সতর্কতার সাথে বাছাই করি এবং হাইজেনিক প্যাকেজিংয়ে সরবরাহ করি। আমাদের লক্ষ্য
        হলো সাশ্রয়ী মূল্যে ভালো মানের শুঁটকি ক্রেতার কাছে পৌঁছে দেওয়া।
      </p>
      <p className="mt-4 text-sm text-navy-700">
        দ্রষ্টব্য: এই পাতার কোনো তথ্য যাচাই-অযোগ্য দাবি নয় — নির্দিষ্ট পরিসংখ্যান বা সনদ থাকলে তা
        এখানে যোগ করা যেতে পারে।
      </p>
    </div>
  );
}
