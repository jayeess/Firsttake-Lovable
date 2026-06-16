import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertEnvKeys,
  getEnvErrorMessage,
  getMissingEnvKeys,
  normalizeFirebasePrivateKey,
  validateEnvKeys,
  validatePublicFirebaseEnv,
  validateServerFirebaseEnv,
} from '../app/lib/env-validation.ts';
import { parseJsonBody, requireMethod } from '../app/lib/api-helpers.ts';
import {
  sanitizeLogContext,
} from '../app/lib/server-logger.ts';
import {
  getAppBaseUrl,
  getConfiguredAppUrl,
  getRequestOrigin,
  normalizeAppUrl,
} from '../app/lib/app-url.ts';

test('environment validation reports missing names without values', () => {
  const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'public-key',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: '',
  };
  assert.deepEqual(
    getMissingEnvKeys(
      ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
      env
    ),
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID']
  );
  const status = validateEnvKeys(['A', 'B'], { A: 'yes' });
  assert.equal(status.ok, false);
  assert.deepEqual(status.present, ['A']);
  assert.deepEqual(status.missing, ['B']);
  assert.match(
    getEnvErrorMessage('Firebase web', ['SECRET_NAME']),
    /SECRET_NAME/
  );
  assert.doesNotMatch(
    getEnvErrorMessage('Firebase web', ['SECRET_NAME']),
    /public-key/
  );
});

test('Firebase env helpers validate public and server groups', () => {
  const completePublic = {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'x',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'x',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'x',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'x',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'x',
    NEXT_PUBLIC_FIREBASE_APP_ID: 'x',
  };
  const completeServer = {
    FIREBASE_ADMIN_PROJECT_ID: 'x',
    FIREBASE_ADMIN_CLIENT_EMAIL: 'admin@example.test',
    FIREBASE_ADMIN_PRIVATE_KEY: 'line1\\nline2',
  };
  assert.equal(validatePublicFirebaseEnv(completePublic).ok, true);
  assert.equal(validateServerFirebaseEnv(completeServer).ok, true);
  assert.equal(normalizeFirebasePrivateKey('line1\\nline2'), 'line1\nline2');
  assert.throws(
    () => assertEnvKeys('Test', ['MISSING'], {}),
    /MISSING/
  );
});

test('safe logging strips secret-like context keys', () => {
  assert.deepEqual(
    sanitizeLogContext({
      action: 'approve',
      idToken: 'secret',
      privateKey: 'secret',
      messageBody: 'secret',
      requestId: 'req-a',
    }),
    { action: 'approve', requestId: 'req-a' }
  );
});

test('API helpers reject wrong methods and oversized payloads', async () => {
  assert.throws(
    () => requireMethod(new Request('https://example.test', { method: 'GET' }), 'POST'),
    /POST requests/
  );
  await assert.rejects(
    parseJsonBody(
      new Request('https://example.test', {
        method: 'POST',
        headers: { 'content-length': '99' },
        body: '{}',
      }),
      10
    ),
    /too large/
  );
  assert.deepEqual(
    await parseJsonBody<{ ok: boolean }>(
      new Request('https://example.test', {
        method: 'POST',
        body: JSON.stringify({ ok: true }),
      })
    ),
    { ok: true }
  );
});

test('app URL helper normalizes production URLs without exposing secrets', () => {
  assert.equal(
    normalizeAppUrl('nata-connect.vercel.app'),
    'https://nata-connect.vercel.app'
  );
  assert.equal(
    normalizeAppUrl('https://example.com/path/'),
    'https://example.com/path'
  );
  assert.equal(normalizeAppUrl('javascript:alert(1)'), '');
  assert.equal(
    getConfiguredAppUrl({ NEXT_PUBLIC_APP_URL: 'https://beta.example.com/' }),
    'https://beta.example.com'
  );
  assert.equal(
    getConfiguredAppUrl({ VERCEL_URL: 'nata-connect-prod.vercel.app' }),
    'https://nata-connect-prod.vercel.app'
  );
  const request = new Request('https://ignored.test', {
    headers: {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'app.example.com',
    },
  });
  assert.equal(getRequestOrigin(request), 'https://app.example.com');
  assert.equal(getAppBaseUrl(undefined, {}), 'http://localhost:3000');
});
