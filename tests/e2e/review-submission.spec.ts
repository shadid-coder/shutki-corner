import { test, expect } from '@playwright/test';

// Requires: a seeded test customer with a DELIVERED order containing a
// not-yet-reviewed line item. In CI this is set up via a dedicated
// test-data script rather than the demo seed (see README > Testing).
test.describe('Review submission flow', () => {
  test('customer can submit a review for a delivered, unreviewed order item', async ({ page }) => {
    // Assumes an authenticated session cookie has been set up by a
    // global setup script (OTP login is skipped in test via a dev-only
    // bypass documented in README > Testing).
    await page.goto('/account/orders');

    const reviewLink = page.getByRole('link', { name: 'রিভিউ দিন' }).first();
    await reviewLink.click();

    await expect(page).toHaveURL(/\/reviews\/new/);

    await page.getByRole('button', { name: '৪ তারা' }).click();
    await page.getByLabel('আপনার মতামত').fill('পণ্যের মান ভালো ছিল, সময়মতো পৌঁছেছে।');
    await page.getByRole('button', { name: 'রিভিউ জমা দিন' }).click();

    await expect(page.getByText('ধন্যবাদ, আপনার মতামত জমা হয়েছে')).toBeVisible();
  });

  test('review button does not appear for a non-delivered order item', async ({ page }) => {
    await page.goto('/account/orders');
    // Items belonging to non-delivered orders should show no review CTA.
    const pendingOrderCard = page.locator('.card', { hasText: 'অপেক্ষমাণ' }).first();
    await expect(pendingOrderCard.getByRole('link', { name: 'রিভিউ দিন' })).toHaveCount(0);
  });

  test('submitting a second review for the same order item is rejected', async ({ request }) => {
    // Direct API check: eligibility is enforced server-side, not just hidden in the UI.
    const res = await request.post('/api/reviews', {
      data: { orderItemId: 'already-reviewed-item-id', rating: 5, bodyBn: 'আবার চেষ্টা' }
    });
    expect(res.status()).toBe(409);
  });
});
