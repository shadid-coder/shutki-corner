import { test, expect } from '@playwright/test';

// Requires: `npm run prisma:seed` to have run against the test database,
// so that the demo product "premium-loitta-shutki" exists with stock.
test.describe('Checkout flow', () => {
  test('guest can browse, add to cart, and place a COD order', async ({ page }) => {
    await page.goto('/shop/premium-loitta-shutki');

    // Select the 250g variant (default) and add to cart.
    await page.getByRole('button', { name: /কার্টে যোগ করুন/ }).click();
    await expect(page.getByText('কার্টে যোগ করা হয়েছে')).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByText('আপনার কার্ট')).toBeVisible();

    await page.getByRole('link', { name: /চেকআউটে যান/ }).click();

    await page.getByLabel('পূর্ণ নাম').fill('Test Customer');
    await page.getByLabel('মোবাইল নাম্বার').fill('01712345678');
    await page.getByLabel('জেলা').selectOption('ঢাকা');
    await page.getByLabel('এলাকা/উপজেলা').fill('ধানমন্ডি');
    await page.getByLabel(/শর্তাবলী/).check();

    await page.getByRole('button', { name: /অর্ডার নিশ্চিত করুন/ }).click();

    await expect(page).toHaveURL(/\/order-confirmation\//);
    await expect(page.getByText('আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে')).toBeVisible();
  });

  test('cannot check out with an empty cart', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/checkout');
    await page.getByRole('button', { name: /অর্ডার নিশ্চিত করুন/ }).click();
    await expect(page.getByText('আপনার কার্ট খালি')).toBeVisible();
  });
});
