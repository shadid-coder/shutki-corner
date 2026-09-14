import { z } from 'zod';

// Bangladeshi mobile numbers: 01XXXXXXXXX (11 digits) or +8801XXXXXXXXX
const bdPhoneRegex = /^(?:\+?880|0)1[3-9]\d{8}$/;

export const phoneSchema = z
  .string()
  .trim()
  .regex(bdPhoneRegex, 'সঠিক মোবাইল নাম্বার দিন, যেমনঃ 01XXXXXXXXX');

export const otpRequestSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(2, 'নাম আবশ্যক').max(80).optional()
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6)
});

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'নাম আবশ্যক').max(80),
  phone: phoneSchema,
  district: z.string().trim().min(2, 'জেলা নির্বাচন করুন'),
  upazila: z.string().trim().min(2, 'এলাকা/উপজেলা লিখুন'),
  landmark: z.string().trim().max(200).optional(),
  deliveryNote: z.string().trim().max(300).optional(),
  contactMethod: z.enum(['call', 'whatsapp', 'sms']),
  paymentMethod: z.enum(['COD', 'MANUAL_BKASH', 'MANUAL_NAGAD','ONLINE_GATEWAY']),
  trxId: z.string().optional(),
  senderPhone: z.string().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'শর্তাবলী মেনে নিতে হবে' })
  }),
  idempotencyKey: z.string().min(10),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        qty: z.number().int().positive().max(50)
      })
    )
    .min(1, 'কার্ট খালি')
});

export const reviewSubmitSchema = z.object({
  orderItemId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  bodyBn: z.string().trim().min(5, 'অন্তত কয়েকটি শব্দ লিখুন').max(1000),
  // Format-only check here. The real trust boundary is server-side:
  // the route verifies this URL was produced by OUR upload endpoint for
  // THIS user (see isReviewPhotoUrlOwnedBy in src/lib/storage/provider.ts)
  // before ever saving it — an arbitrary external image URL is rejected
  // even though it would pass this schema.
  photoUrl: z.string().url().optional()
});

// Only fields a customer may change on their own review. productId,
// orderItemId, userId, and isVerified are intentionally absent — even if
// a client sends them, there is no code path that reads them off this
// object, so they can never reach the database update.
export const reviewEditSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    bodyBn: z.string().trim().min(5, 'অন্তত কয়েকটি শব্দ লিখুন').max(1000).optional(),
    photoUrl: z.string().url().optional().nullable()
  })
  .refine((data) => data.rating !== undefined || data.bodyBn !== undefined || data.photoUrl !== undefined, {
    message: 'পরিবর্তন করার মতো কিছু নেই'
  });

export const reviewReportSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.enum(['SPAM', 'ABUSIVE', 'IRRELEVANT', 'FAKE', 'OTHER']),
  note: z.string().trim().max(500).optional()
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  message: z.string().trim().min(5).max(1000)
});
