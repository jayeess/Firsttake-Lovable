'use client';

import {
  Bell,
  CheckCheck,
  ClipboardList,
  Film,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/app/lib/notification-client';
import type { AppNotification } from '@/app/lib/types';
import { AdminShell } from '@/components/admin-shell';
import { AppShell } from '@/components/app-shell';
import { LoadingState } from '@/components/async-state';
import { useAuth } from '@/context/auth-context';

type NotificationFilter =
  | 'ALL'
  | 'APPLICATIONS'
  | 'MESSAGES'
  | 'AUDITIONS'
  | 'TRUST';

const formatNotificationTime = (value?: AppNotification['createdAt']) => {
  if (!value) return 'Just now';
  const date =
    typeof value === 'string'
      ? new Date(value)
      : value instanceof Date
        ? value
        : value.toDate();
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const notificationFilters: Array<{
  value: NotificationFilter;
  label: string;
}> = [
  { value: 'ALL', label: 'All' },
  { value: 'APPLICATIONS', label: 'Applications' },
  { value: 'MESSAGES', label: 'Messages' },
  { value: 'AUDITIONS', label: 'Auditions' },
  { value: 'TRUST', label: 'Trust / Account' },
];

const getNotificationCategory = (
  notification: AppNotification
): NotificationFilter => {
  if (
    notification.relatedEntityType === 'conversation' ||
    notification.type === 'new_message' ||
    notification.type === 'conversation_started'
  ) {
    return 'MESSAGES';
  }
  if (
    notification.relatedEntityType === 'application' ||
    notification.type.startsWith('application_') ||
    notification.type.startsWith('self_tape_')
  ) {
    return 'APPLICATIONS';
  }
  if (
    notification.relatedEntityType === 'audition' ||
    notification.type.startsWith('audition_')
  ) {
    return 'AUDITIONS';
  }
  return 'TRUST';
};

const getNotificationBadge = (notification: AppNotification) => {
  const category = getNotificationCategory(notification);
  if (category === 'APPLICATIONS') return 'Application';
  if (category === 'MESSAGES') return 'Message';
  if (category === 'AUDITIONS') return 'Audition';
  return 'Trust';
};

const getNotificationActionLabel = (notification: AppNotification) => {
  if (!notification.actionUrl) return 'Open';
  if (notification.actionUrl.startsWith('/messages')) return 'Open message';
  if (notification.actionUrl.startsWith('/applications')) return 'View application';
  if (notification.actionUrl.startsWith('/auditions')) return 'View audition';
  if (notification.actionUrl.includes('/profile')) return 'Go to profile';
  if (notification.actionUrl.startsWith('/admin')) return 'Open admin queue';
  return 'View update';
};

const getCategoryIcon = (category: NotificationFilter) => {
  if (category === 'MESSAGES') return MessageSquare;
  if (category === 'APPLICATIONS') return ClipboardList;
  if (category === 'AUDITIONS') return Film;
  return ShieldCheck;
};

function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getNotifications()
      .then((result) => setNotifications(result.notifications))
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Notifications could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () =>
      filter === 'ALL'
        ? notifications
        : notifications.filter(
            (notification) => getNotificationCategory(notification) === filter
          ),
    [filter, notifications]
  );
  const unreadCount = notifications.filter((item) => !item.read).length;

  const openNotification = async (notification: AppNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      );
      window.dispatchEvent(new Event('notifications:changed'));
    }
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  const markAllRead = async () => {
    setBusy(true);
    setError('');
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (markError: unknown) {
      setError(
        markError instanceof Error
          ? markError.message
          : 'Notifications could not be updated.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Activity center</p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#657176]">
            Reviews, applications, casting decisions, and trust updates in one
            place.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={busy || unreadCount === 0}
          className="secondary-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        >
          <CheckCheck aria-hidden="true" size={18} />
          Mark all as read
        </button>
      </div>

      <div className="mt-5 overflow-x-auto border-b border-[#ccd3da]">
        <div className="flex min-w-max gap-1">
        {notificationFilters.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`min-h-12 rounded-t-md px-4 text-sm font-bold ${
              filter === value
                ? 'border-b-2 border-[#008ca6] text-[#008ca6]'
                : 'text-[#66717c]'
            }`}
          >
            {label}
            {value === 'ALL' && unreadCount > 0 ? ` (${unreadCount} unread)` : ''}
          </button>
        ))}
        </div>
      </div>

      {error && (
        <div className="mt-5 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Notifications could not be updated. Try refreshing the page.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <LoadingState label="Loading activity..." />
        ) : visible.length === 0 ? (
          <section className="surface rounded-md p-7 text-center sm:p-10">
            <Bell
              aria-hidden="true"
              className="mx-auto text-[#008ca6]"
              size={30}
            />
            <h2 className="mt-4 text-xl font-black">
              {filter === 'ALL' ? 'You are all caught up' : 'No updates here'}
            </h2>
            <p className="mt-2 text-[#68727c]">
              Application updates and recruiter messages will appear here.
            </p>
          </section>
        ) : (
          visible.map((notification) => {
            const category = getNotificationCategory(notification);
            const Icon = getCategoryIcon(category);
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => void openNotification(notification)}
                className={`surface grid w-full gap-3 rounded-md p-4 text-left transition hover:border-[#008ca6]/45 sm:grid-cols-[40px_1fr_auto] sm:gap-3 ${
                  notification.read ? 'bg-white/70' : 'border-[#00a8c6] bg-white'
                }`}
              >
                <span className="flex items-start gap-3 sm:block">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#edf7f5] text-[#008ca6]">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  {!notification.read && (
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full sm:mx-auto sm:mt-1.5 sm:block ${
                        notification.priority === 'HIGH'
                          ? 'bg-[#e7ad2d]'
                          : 'bg-[#00a8c6]'
                      }`}
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-[#f0f4f5] px-2 py-0.5 text-[10px] font-black uppercase text-[#526168]">
                      {getNotificationBadge(notification)}
                    </span>
                    {!notification.read && notification.priority === 'HIGH' && (
                      <span className="rounded bg-[#fff4d6] px-2 py-0.5 text-[10px] font-black uppercase text-[#8a5b00]">
                        Priority
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block font-black leading-5">{notification.title}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-[#59666b]">
                    {notification.message}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-4 sm:block sm:text-right">
                  <span className="whitespace-nowrap text-xs font-semibold text-[#7a878d]">
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                  {notification.actionUrl && (
                    <span className="mt-2 inline-flex min-h-8 items-center rounded-md border border-[#9fc9c4] px-3 text-xs font-black text-[#008ca6]">
                      {getNotificationActionLabel(notification)}
                    </span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

export default function NotificationsPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? (
    <AdminShell>
      <NotificationCenter />
    </AdminShell>
  ) : (
    <AppShell>
      <NotificationCenter />
    </AppShell>
  );
}
