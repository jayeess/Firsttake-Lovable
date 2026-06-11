import { expect, type Page, test } from '@playwright/test';

type Persona = 'TALENT' | 'RECRUITER' | 'ADMIN';

const credentials = (persona: Persona) => {
  const email = process.env[`E2E_${persona}_EMAIL`];
  const password = process.env[`E2E_${persona}_PASSWORD`];
  return email && password ? { email, password } : null;
};

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login$/, { timeout: 20_000 });
}

test.describe('credential-backed role smoke', () => {
  test('Talent workspace routes load', async ({ page }) => {
    const account = credentials('TALENT');
    test.skip(!account, 'Set E2E_TALENT_EMAIL and E2E_TALENT_PASSWORD.');
    await login(page, account!.email, account!.password);

    for (const route of ['/dashboard', '/talent/profile', '/auditions', '/applications']) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}$`));
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Recruiter workspace routes load', async ({ page }) => {
    const account = credentials('RECRUITER');
    test.skip(!account, 'Set E2E_RECRUITER_EMAIL and E2E_RECRUITER_PASSWORD.');
    await login(page, account!.email, account!.password);

    for (const route of [
      '/dashboard',
      '/recruiter/profile',
      '/recruiter/verification',
      '/recruiter/auditions',
      '/recruiter/auditions/new',
    ]) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Admin workspace routes load with an admin claim', async ({ page }) => {
    const account = credentials('ADMIN');
    test.skip(!account, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.');
    await login(page, account!.email, account!.password);

    for (const route of [
      '/admin',
      '/admin/verifications',
      '/admin/users',
      '/admin/auditions',
      '/admin/audit-logs',
    ]) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}$`));
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Talent cannot enter the admin workspace', async ({ page }) => {
    const account = credentials('TALENT');
    test.skip(!account, 'Set Talent E2E credentials.');
    await login(page, account!.email, account!.password);
    await page.goto('/admin');
    await expect(
      page.getByRole('heading', { name: 'Administrator access required' })
    ).toBeVisible();
  });
});
