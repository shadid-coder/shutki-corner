/**
 * Seed script — development/staging only.
 *
 * Per the project requirements, this NEVER creates fake reviews, fake
 * ratings, or fake testimonials. Products created here are marked
 * `isDemo: true` so they can be identified and removed before go-live.
 * Reviews only ever come from real customers via the review flow after
 * a real order is marked Delivered.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { nameBn: 'লইট্টা শুঁটকি', nameEn: 'Loitta Shutki', slug: 'loitta-shutki' },
  { nameBn: 'চিংড়ি শুঁটকি', nameEn: 'Chingri Shutki', slug: 'chingri-shutki' },
  { nameBn: 'ছুরি শুঁটকি', nameEn: 'Churi Shutki', slug: 'churi-shutki' },
  { nameBn: 'কাঁচকি শুঁটকি', nameEn: 'Kachki Shutki', slug: 'kachki-shutki' },
  { nameBn: 'রূপচাঁদা শুঁটকি', nameEn: 'Rupchada Shutki', slug: 'rupchada-shutki' },
  { nameBn: 'মিশ্র শুঁটকি', nameEn: 'Mixed Shutki', slug: 'mixed-shutki' },
  { nameBn: 'অন্যান্য', nameEn: 'Others', slug: 'others' }
];

const DELIVERY_ZONES = [
  // কক্সবাজার (কম চার্জ)
  { district: 'কক্সবাজার', upazila: 'All', charge: 80 },
  
  // বাকি সব জেলার জন্য ফ্ল্যাট ১৫০ টাকা
  { district: 'ঢাকা', upazila: 'All', charge: 150 },
  { district: 'চট্টগ্রাম', upazila: 'All', charge: 150 },
  { district: 'রাজশাহী', upazila: 'All', charge: 150 },
  { district: 'খুলনা', upazila: 'All', charge: 150 },
  { district: 'বরিশাল', upazila: 'All', charge: 150 },
  { district: 'সিলেট', upazila: 'All', charge: 150 },
  { district: 'রংপুর', upazila: 'All', charge: 150 },
  { district: 'ময়মনসিংহ', upazila: 'All', charge: 150 },
  { district: 'গাজীপুর', upazila: 'All', charge: 150 },
  { district: 'নারায়ণগঞ্জ', upazila: 'All', charge: 150 },
  { district: 'টাঙ্গাইল', upazila: 'All', charge: 150 },
  { district: 'কিশোরগঞ্জ', upazila: 'All', charge: 150 },
  { district: 'মানিকগঞ্জ', upazila: 'All', charge: 150 },
  { district: 'মুন্সিগঞ্জ', upazila: 'All', charge: 150 },
  { district: 'নরসিংদী', upazila: 'All', charge: 150 },
  { district: 'ফরিদপুর', upazila: 'All', charge: 150 },
  { district: 'গোপালগঞ্জ', upazila: 'All', charge: 150 },
  { district: 'মাদারীপুর', upazila: 'All', charge: 150 },
  { district: 'রাজবাড়ী', upazila: 'All', charge: 150 },
  { district: 'শরীয়তপুর', upazila: 'All', charge: 150 },
  { district: 'কুমিল্লা', upazila: 'All', charge: 150 },
  { district: 'ব্রাহ্মণবাড়িয়া', upazila: 'All', charge: 150 },
  { district: 'চাঁদপুর', upazila: 'All', charge: 150 },
  { district: 'ফেনী', upazila: 'All', charge: 150 },
  { district: 'লক্ষ্মীপুর', upazila: 'All', charge: 150 },
  { district: 'নোয়াখালী', upazila: 'All', charge: 150 },
  { district: 'বান্দরবান', upazila: 'All', charge: 150 },
  { district: 'রাঙ্গামাটি', upazila: 'All', charge: 150 },
  { district: 'খাগড়াছড়ি', upazila: 'All', charge: 150 },
  { district: 'বাগেরহাট', upazila: 'All', charge: 150 },
  { district: 'সাতক্ষীরা', upazila: 'All', charge: 150 },
  { district: 'যশোর', upazila: 'All', charge: 150 },
  { district: 'ঝিনাইদহ', upazila: 'All', charge: 150 },
  { district: 'মাগুরা', upazila: 'All', charge: 150 },
  { district: 'নড়াইল', upazila: 'All', charge: 150 },
  { district: 'কুষ্টিয়া', upazila: 'All', charge: 150 },
  { district: 'চুয়াডাঙ্গা', upazila: 'All', charge: 150 },
  { district: 'মেহেরপুর', upazila: 'All', charge: 150 },
  { district: 'নাটোর', upazila: 'All', charge: 150 },
  { district: 'নওগাঁ', upazila: 'All', charge: 150 },
  { district: 'চাঁপাইনবাবগঞ্জ', upazila: 'All', charge: 150 },
  { district: 'পাবনা', upazila: 'All', charge: 150 },
  { district: 'সিরাজগঞ্জ', upazila: 'All', charge: 150 },
  { district: 'বগুড়া', upazila: 'All', charge: 150 },
  { district: 'জয়পুরহাট', upazila: 'All', charge: 150 },
  { district: 'দিনাজপুর', upazila: 'All', charge: 150 },
  { district: 'ঠাকুরগাঁও', upazila: 'All', charge: 150 },
  { district: 'পঞ্চগড়', upazila: 'All', charge: 150 },
  { district: 'নীলফামারী', upazila: 'All', charge: 150 },
  { district: 'লালমনিরহাট', upazila: 'All', charge: 150 },
  { district: 'কুড়িগ্রাম', upazila: 'All', charge: 150 },
  { district: 'গাইবান্ধা', upazila: 'All', charge: 150 },
  { district: 'পটুয়াখালী', upazila: 'All', charge: 150 },
  { district: 'ভোলা', upazila: 'All', charge: 150 },
  { district: 'পিরোজপুর', upazila: 'All', charge: 150 },
  { district: 'বরগুনা', upazila: 'All', charge: 150 },
  { district: 'ঝালকাঠি', upazila: 'All', charge: 150 },
  { district: 'জামালপুর', upazila: 'All', charge: 150 },
  { district: 'নেত্রকোণা', upazila: 'All', charge: 150 },
  { district: 'শেরপুর', upazila: 'All', charge: 150 },
  { district: 'মৌলভীবাজার', upazila: 'All', charge: 150 },
  { district: 'হবিগঞ্জ', upazila: 'All', charge: 150 },
  { district: 'সুনামগঞ্জ', upazila: 'All', charge: 150 },
];

async function main() {
  console.log('Seeding categories...');
  const categoryRecords = await Promise.all(
    CATEGORIES.map((c) => prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c }))
  );

  console.log('Seeding delivery zones...');
  for (const z of DELIVERY_ZONES) {
    await prisma.deliveryZone.upsert({
      where: { district_upazila: { district: z.district, upazila: z.upazila } },
      update: { charge: z.charge },
      create: z
    });
  }

  console.log('Seeding demo products (isDemo: true)...');
  const loitta = categoryRecords.find((c) => c.slug === 'loitta-shutki')!;
  const chingri = categoryRecords.find((c) => c.slug === 'chingri-shutki')!;

  await prisma.product.upsert({
    where: { slug: 'premium-loitta-shutki' },
    update: {},
    create: {
      categoryId: loitta.id,
      slug: 'premium-loitta-shutki',
      nameBn: 'প্রিমিয়াম লইট্টা শুঁটকি',
      nameEn: 'Premium Loitta Shutki',
      shortDescBn: 'রোদে শুকানো প্রিমিয়াম লইট্টা শুঁটকি',
      descriptionBn: 'সতর্কতার সাথে বাছাই করা ও প্রাকৃতিকভাবে রোদে শুকানো লইট্টা শুঁটকি। হাইজেনিক প্যাকেজিংয়ে সরবরাহ করা হয়।',
      storageInfoBn: 'শুষ্ক ও ঠান্ডা স্থানে সংরক্ষণ করুন। দীর্ঘমেয়াদী সংরক্ষণের জন্য ফ্রিজে রাখতে পারেন।',
      originBn: 'উপকূলীয় অঞ্চল, বাংলাদেশ',
      images: ['/placeholder-product.jpg'],
      isDemo: true,
      variants: {
        create: [
          { label: '250g', weightGrams: 250, price: 350, stockQty: 40, sku: 'DEMO-LOITTA-250' },
          { label: '500g', weightGrams: 500, price: 650, stockQty: 25, sku: 'DEMO-LOITTA-500' },
          { label: '1kg', weightGrams: 1000, price: 1200, stockQty: 10, sku: 'DEMO-LOITTA-1000' }
        ]
      }
    }
  });

  await prisma.product.upsert({
    where: { slug: 'premium-chingri-shutki' },
    update: {},
    create: {
      categoryId: chingri.id,
      slug: 'premium-chingri-shutki',
      nameBn: 'প্রিমিয়াম চিংড়ি শুঁটকি',
      nameEn: 'Premium Chingri Shutki',
      shortDescBn: 'ছোট আকারের সুস্বাদু চিংড়ি শুঁটকি',
      descriptionBn: 'উন্নত মানের চিংড়ি বাছাই করে প্রস্তুতকৃত শুঁটকি। রান্নায় বাড়তি স্বাদ যোগ করে।',
      storageInfoBn: 'শুষ্ক ও ঠান্ডা স্থানে সংরক্ষণ করুন।',
      originBn: 'উপকূলীয় অঞ্চল, বাংলাদেশ',
      images: ['/placeholder-product.jpg'],
      isDemo: true,
      variants: {
        create: [
          { label: '250g', weightGrams: 250, price: 420, stockQty: 0, sku: 'DEMO-CHINGRI-250' },
          { label: '500g', weightGrams: 500, price: 800, stockQty: 15, sku: 'DEMO-CHINGRI-500' }
        ]
      }
    }
  });

  console.log('Seeding FAQ site setting...');
  await prisma.siteSetting.upsert({
    where: { key: 'faq' },
    update: {},
    create: {
      key: 'faq',
      value: [
        { q: 'ডেলিভারি পেতে কত সময় লাগে?', a: 'সাধারণত ২-৪ কর্মদিবস।' },
        { q: 'পেমেন্ট পদ্ধতি কী কী?', a: 'বর্তমানে ক্যাশ অন ডেলিভারি চালু আছে।' }
      ]
    }
  });

  console.log('Creating dev-only test accounts...');
  await prisma.user.upsert({
    where: { phone: '01700000001' },
    update: { role: 'ADMIN' },
    create: { phone: '01700000001', name: 'Admin (dev)', role: 'ADMIN' }
  });
  await prisma.user.upsert({
    where: { phone: '01700000002' },
    update: {},
    create: { phone: '01700000002', name: 'Test Customer (dev)', role: 'CUSTOMER' }
  });

  console.log('Seed complete. No reviews were created — reviews only ever come from real customers.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
