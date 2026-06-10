export const getErrorMessage = (error: unknown, fallback: string): string => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  const authMessages: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/user-not-found': 'No account exists for this email address.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'An account already exists for this email.',
    'auth/too-many-requests':
      'Too many attempts. Wait a moment, then try again.',
    'auth/network-request-failed':
      'Firebase could not reach the network. Check your connection and retry.',
    'auth/user-disabled': 'This account has been disabled.',
  };

  if (authMessages[code]) {
    return authMessages[code];
  }

  if (error instanceof Error && error.message) {
    const matchingCode = Object.keys(authMessages).find((authCode) =>
      error.message.includes(authCode)
    );
    if (matchingCode) {
      return authMessages[matchingCode];
    }
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  return fallback;
};
