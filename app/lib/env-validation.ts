export const PUBLIC_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

export const SERVER_ENV_KEYS = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
] as const;

export type EnvStatus = {
  ok: boolean;
  missing: string[];
  present: string[];
};

type EnvMap = Record<string, string | undefined>;

export const getMissingEnvKeys = (
  keys: readonly string[],
  env: EnvMap = process.env
) => keys.filter((key) => !env[key]?.trim());

export const validateEnvKeys = (
  keys: readonly string[],
  env: EnvMap = process.env
): EnvStatus => {
  const missing = getMissingEnvKeys(keys, env);
  return {
    ok: missing.length === 0,
    missing,
    present: keys.filter((key) => !missing.includes(key)),
  };
};

export const validatePublicFirebaseEnv = (env: EnvMap = process.env) =>
  validateEnvKeys(PUBLIC_ENV_KEYS, env);

export const validateServerFirebaseEnv = (env: EnvMap = process.env) =>
  validateEnvKeys(SERVER_ENV_KEYS, env);

export const normalizeFirebasePrivateKey = (value?: string) =>
  value?.replace(/\\n/g, '\n');

export const getEnvErrorMessage = (label: string, missing: readonly string[]) =>
  missing.length === 0
    ? ''
    : `${label} configuration is missing: ${missing.join(', ')}. Add these variables in the local environment or hosting dashboard. Secret values are never printed.`;

export const assertEnvKeys = (
  label: string,
  keys: readonly string[],
  env: EnvMap = process.env
) => {
  const status = validateEnvKeys(keys, env);
  if (!status.ok) {
    throw new Error(getEnvErrorMessage(label, status.missing));
  }
  return status;
};
