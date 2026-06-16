const trimSlash = (value: string) => value.replace(/\/+$/, '');

export const normalizeAppUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return trimSlash(url.toString());
  } catch {
    return '';
  }
};

export const getConfiguredAppUrl = (
  env: Record<string, string | undefined> = process.env
) =>
  normalizeAppUrl(env.NEXT_PUBLIC_APP_URL) ||
  normalizeAppUrl(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : '');

export const getRequestOrigin = (request: Request) =>
  normalizeAppUrl(request.headers.get('origin')) ||
  normalizeAppUrl(
    `${request.headers.get('x-forwarded-proto') ?? 'https'}://${request.headers.get(
      'x-forwarded-host'
    ) ?? request.headers.get('host') ?? ''}`
  );

export const getAppBaseUrl = (
  request?: Request,
  env: Record<string, string | undefined> = process.env
) =>
  getConfiguredAppUrl(env) ||
  (request ? getRequestOrigin(request) : '') ||
  'http://localhost:3000';
