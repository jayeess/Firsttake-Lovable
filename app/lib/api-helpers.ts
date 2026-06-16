export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const parseJsonBody = async <T>(
  request: Request,
  maxBytes = 20_000
): Promise<T> => {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > maxBytes) {
    throw new ApiRequestError('Request payload is too large.', 413);
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiRequestError('Request body must be valid JSON.');
  }
};

export const requireMethod = (request: Request, method: string) => {
  if (request.method !== method) {
    throw new ApiRequestError(`${method} requests are required.`, 405);
  }
};
