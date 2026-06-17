import type { NotificationInput } from '../notification-policy';

const SAFETY_FOOTER =
  'For your safety, keep casting communication on Nata Connect and never pay to audition.';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeActionUrl = (actionUrl?: string): string | undefined => {
  if (!actionUrl) return undefined;
  const trimmed = actionUrl.trim();
  return trimmed.startsWith('/') && !trimmed.startsWith('//')
    ? trimmed
    : undefined;
};

const joinUrl = (baseUrl: string, path?: string) => {
  const normalizedPath = normalizeActionUrl(path);
  if (!normalizedPath) return baseUrl;
  return `${baseUrl.replace(/\/+$/, '')}${normalizedPath}`;
};

export const buildNotificationEmail = ({
  notification,
  appBaseUrl,
}: {
  notification: NotificationInput;
  appBaseUrl: string;
}) => {
  const title = notification.title.trim().slice(0, 140);
  const message = notification.message.trim().slice(0, 600);
  const actionUrl = joinUrl(appBaseUrl, notification.actionUrl);
  const subject = `Nata Connect: ${title}`;
  const text = [
    'Nata Connect',
    '',
    title,
    '',
    message,
    '',
    `Open Nata Connect: ${actionUrl}`,
    '',
    SAFETY_FOOTER,
  ].join('\n');
  const html = [
    '<main style="font-family:Arial,sans-serif;line-height:1.6;color:#07111f">',
    '<p style="font-weight:700;color:#008ca6">Nata Connect</p>',
    `<h1 style="font-size:22px">${escapeHtml(title)}</h1>`,
    `<p>${escapeHtml(message)}</p>`,
    `<p><a href="${escapeHtml(actionUrl)}" style="color:#008ca6;font-weight:700">Open Nata Connect</a></p>`,
    `<p style="font-size:13px;color:#657176">${escapeHtml(SAFETY_FOOTER)}</p>`,
    '</main>',
  ].join('');

  return { subject, text, html };
};
