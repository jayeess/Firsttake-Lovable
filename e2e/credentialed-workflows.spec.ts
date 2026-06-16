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
    await expect(
      page.getByRole('heading', { name: 'Show your work' })
    ).toBeVisible();
    await expect(
      page.getByText('Add portfolio image', { exact: true })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Notifications/ })).toBeVisible();
    await expectWorkspacePage(page, '/auditions', 'Find the right next role.');
    await expect(
      page.getByRole('region', { name: 'Audition search and filters' })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Search role, project/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Filters/ })).toBeVisible();
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

  test('Recruiter applicant pipeline controls render', async ({ page }) => {
    const account = credentials('RECRUITER');
    const auditionId = process.env.E2E_RECRUITER_AUDITION_ID;
    test.skip(
      !account || !auditionId,
      'Set Recruiter E2E credentials and E2E_RECRUITER_AUDITION_ID.'
    );
    await login(page, account!.email, account!.password);
    await page.goto(`/recruiter/auditions/${auditionId}/applicants`);

    await expect(page.getByText('Applicant pipeline').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole('region', { name: 'Applicant status filters' })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Search name, category/)).toBeVisible();
    await expect(page.getByPlaceholder('Filter by internal tag')).toBeVisible();
    await expect(page.getByPlaceholder('Language')).toBeVisible();
    await page.getByRole('button', { name: 'Review profile' }).first().click();
    await expect(page.getByText('Private casting notes')).toBeVisible();
    await expect(page.getByLabel('Rate 5 stars')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Message Talent/ })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Notifications/ })).toBeVisible();
  });

  test('Talent saved audition control renders', async ({ page }) => {
    const account = credentials('TALENT');
    const auditionId = process.env.E2E_TALENT_AUDITION_ID;
    test.skip(
      !account || !auditionId,
      'Set Talent E2E credentials and E2E_TALENT_AUDITION_ID.'
    );
    await login(page, account!.email, account!.password);
    await page.goto(`/auditions/${auditionId}`);
    await expect(
      page.getByRole('button', {
        name: /Save audition|Remove saved audition/,
      })
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Report', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Report a concern' })
    ).toBeVisible();
    await page.getByLabel(/What is the concern/).selectOption('other');
    await expect(
      page.getByRole('button', { name: 'Submit report' })
    ).toBeDisabled();
    await page.getByLabel(/Details/).fill('Enough detail for validation only.');
    await expect(
      page.getByRole('button', { name: 'Submit report' })
    ).toBeEnabled();
    await expect(page.getByRole('link', { name: /Notifications/ })).toBeVisible();
  });

  test('Talent messages route renders', async ({ page }) => {
    const account = credentials('TALENT');
    test.skip(!account, 'Set E2E_TALENT_EMAIL and E2E_TALENT_PASSWORD.');
    await login(page, account!.email, account!.password);
    await expectWorkspacePage(page, '/messages', 'Messages');
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
    await expectWorkspacePage(
      page,
      '/admin/messages',
      'Conversation moderation'
    );
    await expectWorkspacePage(page, '/admin/reports', 'Report queue');
    await expectWorkspacePage(
      page,
      '/admin/beta-readiness',
      'Launch control checklist'
    );
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
