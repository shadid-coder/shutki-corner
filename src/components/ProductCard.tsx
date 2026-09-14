import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import { formatTaka } from '@/lib/format';

export interface ProductCardData {
  slug: string;
  nameBn: string;
  shortDescBn: string;
  image: string;
  minPrice: number;
  inStock: boolean;
  avgRating: number;
  reviewCount: number;
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link 
      href={`/shop/${product.slug}`} 
      className="group flex flex-col h-full overflow-hidden rounded-xl border border-beige-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* ইমেজ সেকশন */}
      <div className="relative aspect-square w-full overflow-hidden bg-beige-50">
        <Image
          src={product.image}
          alt={product.nameBn}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          loading="lazy"
        />
        {!product.inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500/90 px-3 py-1 text-xs font-medium text-white shadow-sm">
            স্টকে নেই
          </span>
        )}
      </div>

      {/* কনটেন্ট সেকশন */}
      <div className="flex flex-col flex-grow p-3 md:p-4 gap-2">
        <div>
          {/* নামটি ২ লাইনে দেখানোর জন্য line-clamp-2 করা হয়েছে */}
          <h3 className="font-bold text-navy-950 text-base md:text-lg group-hover:text-sea-600 transition-colors line-clamp-2 leading-tight">
            {product.nameBn}
          </h3>
          <p className="mt-1 text-xs md:text-sm text-navy-600 line-clamp-2">
            {product.shortDescBn}
          </p>
        </div>

        <div className="mt-auto pt-2">
          <StarRating value={product.avgRating} count={product.reviewCount} />
        </div>

        {/* দাম এবং বাটন - মোবাইলে স্ট্যাক হবে, ডেস্কটপে পাশাপাশি */}
        <div className="mt-3 flex flex-col gap-2 border-t border-beige-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-navy-500">শুরু</span>
            <span className="text-lg md:text-xl font-extrabold text-navy-950">
              {formatTaka(product.minPrice)}
            </span>
          </div>
          
          <span
            className={`w-full text-center sm:w-auto rounded-lg px-2 py-1.5 text-xs md:text-sm font-semibold transition-colors ${
              product.inStock 
                ? 'bg-sea-600 text-white group-hover:bg-sea-700 shadow-sm' 
                : 'cursor-not-allowed bg-beige-200 text-navy-700/50'
            }`}
          >
            {product.inStock ? 'কার্টে যোগ' : 'স্টকে নেই'}
          </span>
        </div>
      </div>
    </Link>
  );
}