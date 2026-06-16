'use client';

import { Bell, CheckCheck } from 'lucide-react';
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
import { useAuth } from '@/context/auth-context';

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

function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
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
      filter === 'UNREAD'
        ? notifications.filter((notification) => !notification.read)
        : notifications,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Activity center</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#657176] sm:text-base">
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

      <div className="mt-7 flex gap-1 border-b border-[#ccd3da]">
        {(['ALL', 'UNREAD'] as const).map((value) => (
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
            {value === 'ALL' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm font-semibold text-[#657176]">
            Loading activity...
          </p>
        ) : visible.length === 0 ? (
          <section className="surface rounded-md p-7 text-center sm:p-10">
            <Bell
              aria-hidden="true"
              className="mx-auto text-[#008ca6]"
              size={30}
            />
            <h2 className="mt-4 text-xl font-black">
              {filter === 'UNREAD' ? 'You are all caught up' : 'No activity yet'}
            </h2>
            <p className="mt-2 text-[#68727c]">
              Important account and workflow updates will appear here.
            </p>
          </section>
        ) : (
          visible.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void openNotification(notification)}
              className={`surface grid w-full grid-cols-[12px_1fr] gap-3 rounded-md p-4 text-left transition hover:border-[#008ca6]/45 sm:grid-cols-[12px_1fr_auto] sm:gap-4 sm:p-5 ${
                notification.read ? 'bg-white/70' : 'border-[#00a8c6] bg-white'
              }`}
            >
              <span
                className={`mt-1.5 size-2.5 rounded-full ${
                  notification.read
                    ? 'bg-[#c8d2d8]'
                    : notification.priority === 'HIGH'
                      ? 'bg-[#e7ad2d]'
                      : 'bg-[#00a8c6]'
                }`}
              />
              <span>
                <span className="block font-black">{notification.title}</span>
                <span className="mt-1 block text-sm leading-6 text-[#59666b]">
                  {notification.message}
                </span>
              </span>
              <span className="col-start-2 whitespace-nowrap text-xs font-semibold text-[#7a878d] sm:col-start-auto">
                {formatNotificationTime(notification.createdAt)}
              </span>
            </button>
          ))
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
