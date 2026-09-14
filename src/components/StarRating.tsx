export default function StarRating({ value, count }: { value: number; count?: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-1 text-sm" aria-label={`রেটিং ${value.toFixed(1)} এর মধ্যে ৫`}>
      <span aria-hidden className="text-amber-500">
        {'★'.repeat(rounded)}
        {'☆'.repeat(5 - rounded)}
      </span>
      <span className="text-navy-700">
        {value > 0 ? value.toFixed(1) : 'নতুন'}
        {typeof count === 'number' ? ` (${count})` : ''}
      </span>
    </div>
  );
}
