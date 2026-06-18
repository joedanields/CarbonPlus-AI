import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('page loads and renders primary elements', async ({ page }) => {
    // Before interacting, we might need to complete onboarding if the app redirects
    if (await page.url().includes('/onboarding')) {
      await page.click('button:has-text("Get Started")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Complete Setup")');
    }

    await expect(page.getByRole('heading', { name: /Log today.s activity/i })).toBeVisible();
    await expect(page.getByText(/Your personal dashboard/i)).toBeVisible();
  });

  test('form submission updates the UI', async ({ page }) => {
    if (await page.url().includes('/onboarding')) {
      await page.click('button:has-text("Get Started")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Complete Setup")');
    }

    await page.fill('#distance-km', '10');
    await page.selectOption('#transport-mode', 'car');
    await page.selectOption('#diet-type', 'vegan');
    await page.fill('#home-energy', '2');
    await page.click('button:has-text("Calculate my footprint")');

    // "Activity added. Your footprint has been updated."
    const statusMsg = page.locator('p[role="status"]').filter({ hasText: 'Activity added' });
    await expect(statusMsg).toBeVisible();
  });

  test('reset clears all data', async ({ page }) => {
    if (await page.url().includes('/onboarding')) {
      await page.click('button:has-text("Get Started")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Complete Setup")');
    }

    // First log something
    await page.fill('#distance-km', '10');
    await page.click('button:has-text("Calculate my footprint")');

    // Wait for the modal or anything blocking the reset button to go away
    await page.waitForTimeout(500);

    // Click reset
    await page.click('button[aria-label="Reset all activity data"]', { force: true });

    // Confirm in dialog (use a specific locator to avoid clicking something behind)
    const dialog = page.locator('div[role="alertdialog"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('button', { hasText: 'Clear data' }).click({ force: true });

    await expect(page.getByText(/No activity logged yet/i)).toBeVisible();
  });

  test('keyboard navigation through form', async ({ page }) => {
    if (await page.url().includes('/onboarding')) {
      await page.click('button:has-text("Get Started")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Complete Setup")');
    }

    await page.focus('#transport-mode');
    await page.keyboard.press('Tab');
    await expect(page.locator('#distance-km')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#diet-type')).toBeFocused();
  });

  test('responsive layout checks', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('header')).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('header')).toBeVisible();
  });
});
