import { expect, test } from '@playwright/test';

test.describe('public routes', () => {
  const routes = [
    ['/', /Talent finds its stage/i],
    ['/auth/login', /Continue your casting journey/i],
    ['/auth/signup', /Your next opportunity starts here/i],
    ['/auth/forgot-password', /Reset your password/i],
  ] as const;

  for (const [route, heading] of routes) {
    test(`${route} loads`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    });
  }
});

test.describe('unauthenticated route protection', () => {
  const protectedRoutes = [
    '/dashboard',
    '/applications',
    '/auditions',
    '/talent/profile',
    '/recruiter/profile',
    '/recruiter/verification',
    '/recruiter/auditions',
    '/recruiter/auditions/new',
    '/admin',
    '/admin/verifications',
    '/admin/talents',
    '/admin/users',
    '/admin/auditions',
    '/admin/audit-logs',
  ];

  for (const route of protectedRoutes) {
    test(`${route} sends signed-out users to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth\/login$/, { timeout: 15_000 });
    });
  }
});
