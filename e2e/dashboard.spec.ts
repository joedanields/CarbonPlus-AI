import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('page loads and renders primary elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Log today.s activity/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Your personal dashboard/i })).toBeVisible();
  });

  test('form submission updates the UI', async ({ page }) => {
    await page.fill('#distance-km', '10');
    await page.selectOption('#transport-mode', 'car');
    await page.selectOption('#diet-type', 'vegan');
    await page.fill('#home-energy', '2');
    await page.click('button:has-text("Calculate my footprint")');

    await expect(page.getByText(/Activity added/i)).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Activity added');
  });

  test('reset clears all data', async ({ page }) => {
    // First log something
    await page.fill('#distance-km', '10');
    await page.click('button:has-text("Calculate my footprint")');

    // Click reset
    await page.click('button[aria-label="Reset all activity data"]');

    // Confirm in dialog
    await page.click('button:has-text("Clear data")');

    await expect(page.getByText(/No activity logged yet/i)).toBeVisible();
  });

  test('keyboard navigation through form', async ({ page }) => {
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
