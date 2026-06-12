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

async function expectWorkspacePage(
  page: Page,
  route: string,
  heading: string | RegExp
) {
  await page.goto(route);
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Application error|Internal Server Error/i)).toHaveCount(0);
}

test.describe('credential-backed role smoke', () => {
  test('Talent workspace routes load', async ({ page }) => {
    const account = credentials('TALENT');
    test.skip(!account, 'Set E2E_TALENT_EMAIL and E2E_TALENT_PASSWORD.');
    await login(page, account!.email, account!.password);

    await expectWorkspacePage(page, '/dashboard', /Welcome/i);
    await expectWorkspacePage(
      page,
      '/talent/profile',
      'Build your professional profile'
    );
    await expectWorkspacePage(page, '/auditions', 'Roles worth showing up for.');
    await expectWorkspacePage(page, '/applications', 'My applications');
    await expectWorkspacePage(page, '/notifications', 'Notifications');

    await expect(page.getByRole('link', { name: 'Find auditions' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My applications' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Post an audition' })).toHaveCount(0);
  });

  test('Recruiter workspace routes load', async ({ page }) => {
    const account = credentials('RECRUITER');
    test.skip(!account, 'Set E2E_RECRUITER_EMAIL and E2E_RECRUITER_PASSWORD.');
    await login(page, account!.email, account!.password);

    await expectWorkspacePage(page, '/recruiter/profile', 'Company profile');
    await expectWorkspacePage(
      page,
      '/recruiter/verification',
      'Private-beta verification'
    );
    await expectWorkspacePage(page, '/recruiter/auditions', 'My auditions');
    await expectWorkspacePage(
      page,
      '/recruiter/auditions/new',
      'Shape the opportunity clearly.'
    );
    await expectWorkspacePage(page, '/notifications', 'Notifications');

    await expect(page.getByRole('link', { name: 'Casting pipeline' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Post an audition' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My applications' })).toHaveCount(0);
  });

  test('Admin workspace routes load with an admin claim', async ({ page }) => {
    const account = credentials('ADMIN');
    test.skip(!account, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.');
    await login(page, account!.email, account!.password);

    await expectWorkspacePage(page, '/admin', 'Platform integrity at a glance.');
    await expectWorkspacePage(page, '/admin/verifications', 'Verification queue');
    await expectWorkspacePage(page, '/admin/talents', 'Talent verification');
    await expectWorkspacePage(page, '/admin/users', 'User management');
    await expectWorkspacePage(page, '/admin/auditions', 'Audition moderation');
    await expectWorkspacePage(page, '/admin/audit-logs', 'Audit logs');
    await expectWorkspacePage(page, '/notifications', 'Notifications');

    await expect(page.getByRole('navigation').getByText('Verifications')).toBeVisible();
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

  test('Recruiter cannot enter the admin workspace', async ({ page }) => {
    const account = credentials('RECRUITER');
    test.skip(!account, 'Set Recruiter E2E credentials.');
    await login(page, account!.email, account!.password);
    await page.goto('/admin');
    await expect(
      page.getByRole('heading', { name: 'Administrator access required' })
    ).toBeVisible();
  });
});
