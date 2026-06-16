type LogLevel = 'info' | 'warn' | 'error';

type SafeLogContext = Record<
  string,
  string | number | boolean | null | undefined
>;

const blockedKeyPattern =
  /(token|authorization|private|secret|password|body|message|emailContent)/i;

export const sanitizeLogContext = (context: SafeLogContext = {}) =>
  Object.fromEntries(
    Object.entries(context)
      .filter(([key]) => !blockedKeyPattern.test(key))
      .map(([key, value]) => [key, value ?? null])
  );

export const logServerEvent = (
  level: LogLevel,
  event: string,
  context: SafeLogContext = {}
) => {
  const payload = {
    event,
    ...sanitizeLogContext(context),
  };
  if (level === 'error') {
    console.error('[nata-connect]', payload);
    return;
  }
  if (level === 'warn') {
    console.warn('[nata-connect]', payload);
    return;
  }
  console.info('[nata-connect]', payload);
};

export const getRequestId = (request: Request) =>
  request.headers.get('x-vercel-id') ||
  request.headers.get('x-request-id') ||
  crypto.randomUUID();
