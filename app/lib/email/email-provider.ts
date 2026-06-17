export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type EmailSendResult =
  | { status: 'noop'; provider: 'none' }
  | { status: 'sent'; provider: 'resend' }
  | { status: 'skipped'; provider: 'none'; reason: string }
  | { status: 'failed'; provider: 'resend'; reason: string };

const logEmailEvent = (
  level: 'info' | 'warn',
  event: string,
  context: Record<string, string | number | boolean | null | undefined>
) => {
  const payload = { event, ...context };
  if (level === 'warn') {
    console.warn('[nata-connect]', payload);
    return;
  }
  console.info('[nata-connect]', payload);
};

export const getEmailProviderStatus = (
  env: Record<string, string | undefined> = process.env
) => {
  const provider = env.EMAIL_PROVIDER?.trim().toLowerCase() || '';
  const configured = provider === 'resend' && Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
  const missing =
    provider === 'resend'
      ? [
          !env.RESEND_API_KEY ? 'RESEND_API_KEY' : '',
          !env.EMAIL_FROM ? 'EMAIL_FROM' : '',
        ].filter(Boolean)
      : [];
  return {
    provider: provider || 'none',
    configured,
    missing,
    replyToConfigured: Boolean(env.EMAIL_REPLY_TO),
  };
};

const getEmailFrom = (env: Record<string, string | undefined>) =>
  env.EMAIL_FROM?.trim() || '';

export const sendEmail = async (
  message: EmailMessage,
  env: Record<string, string | undefined> = process.env
): Promise<EmailSendResult> => {
  const status = getEmailProviderStatus(env);
  if (!message.to.trim()) {
    return { status: 'skipped', provider: 'none', reason: 'missing_recipient' };
  }
  if (status.provider !== 'resend' || !status.configured) {
    logEmailEvent('info', 'email_noop_delivery', {
      provider: status.provider,
      configured: status.configured,
      missingCount: status.missing.length,
    });
    return { status: 'noop', provider: 'none' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getEmailFrom(env),
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        reply_to: message.replyTo ?? env.EMAIL_REPLY_TO,
      }),
    });
    if (!response.ok) {
      logEmailEvent('warn', 'email_provider_rejected_delivery', {
        provider: 'resend',
        status: response.status,
      });
      return {
        status: 'failed',
        provider: 'resend',
        reason: `provider_status_${response.status}`,
      };
    }
    return { status: 'sent', provider: 'resend' };
  } catch (error: unknown) {
    logEmailEvent('warn', 'email_provider_delivery_failed', {
      provider: 'resend',
      name: error instanceof Error ? error.name : 'UnknownError',
    });
    return {
      status: 'failed',
      provider: 'resend',
      reason: error instanceof Error ? error.name : 'UnknownError',
    };
  }
};
