import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে | শুঁটকি কর্নার',
  description: 'কক্সবাজার থেকে সংগ্রহ করা সেরা মানের শুঁটকি, যত্নসহকারে আপনার ঘরে পৌঁছে দেওয়া আমাদের লক্ষ্য।',
};

export default function AboutPage() {
  return (
    <div className="container-app max-w-4xl py-12">
      <h1 className="text-3xl font-bold text-navy-950 mb-6">আমাদের সম্পর্কে</h1>
      
      <div className="prose prose-navy max-w-none text-navy-800 leading-relaxed space-y-6">
        <p>
          <strong>শুঁটকি কর্নার</strong> একটি অনলাইন শুঁটকি বিক্রেতা প্রতিষ্ঠান, যা সরাসরি <strong>কক্সবাজার</strong> থেকে সংগ্রহ করা সেরা মানের শুঁটকি গ্রাহকের ঘরে পৌঁছে দেয়। আমরা বিশ্বাস করি, ভালো শুঁটকির জন্য সঠিক সংগ্রহ, পরিচ্ছন্ন প্রক্রিয়াকরণ এবং সঠিক সংরক্ষণ অত্যন্ত জরুরি।
        </p>

        <div className="bg-beige-50 p-6 rounded-xl border border-beige-200">
          <h2 className="text-xl font-bold text-navy-950 mb-3">কেন আমাদের থেকে কিনবেন?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>সরাসরি কক্সবাজার থেকে:</strong> মধ্যস্বত্বভোগী ছাড়া সরাসরি সোর্স থেকে সংগ্রহ করা হয়।</li>
            <li><strong>হাইজেনিক প্যাকেজিং:</strong> প্রতিটি পণ্য পরিষ্কার-পরিচ্ছন্নভাবে এবং এয়ারটাইট প্যাকেটে প্যাক করা হয়, যাতে গন্ধ ও মান অটুট থাকে।</li>
            <li><strong>সতর্ক বাছাই:</strong> প্রতিটি শুঁটকি অত্যন্ত যত্নের সাথে বাছাই করা হয়, যাতে আপনি সেরাটাই পান।</li>
            <li><strong>নিরাপদ ডেলিভারি:</strong> সারা বাংলাদেশে দ্রুত ও নিরাপদ ডেলিভারির ব্যবস্থা।</li>
          </ul>
        </div>

        <h2 className="text-xl font-bold text-navy-950 mt-8 mb-3">আমাদের লক্ষ্য</h2>
        <p>
          আমাদের মূল লক্ষ্য হলো—প্রতিটি পরিবারে খাঁটি ও মানসম্মত শুঁটকি পৌঁছে দেওয়া। আপনার সন্তুষ্টিই আমাদের সবচেয়ে বড় প্রাপ্তি। তাই আমরা অর্ডার প্রসেসিং থেকে শুরু করে ডেলিভারি পর্যন্ত প্রতিটি ধাপে সর্বোচ্চ যত্ন নিই।
        </p>

        <h2 className="text-xl font-bold text-navy-950 mt-8 mb-3">যোগাযোগ</h2>
        <p>
          আমাদের সেবার মান নিয়ে আপনার কোনো জিজ্ঞাসা বা পরামর্শ থাকলে আমাদের সাথে যোগাযোগ করতে পারেন। আমরা সবসময় আপনার পাশে আছি।
        </p>
      </div>
    </div>
  );
}