'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getNotifications } from '@/app/lib/notification-client';
import { useAuth } from '@/context/auth-context';

export function NotificationBell({ dark = false }: { dark?: boolean }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    void getNotifications()
      .then((result) => setUnreadCount(result.unreadCount))
      .catch(() => setUnreadCount(0));
  }, [user]);

  useEffect(() => {
    const update = () => {
      if (!user) return;
      void getNotifications()
        .then((result) => setUnreadCount(result.unreadCount))
        .catch(() => setUnreadCount(0));
    };
    if (user) {
      update();
    }
    const interval = window.setInterval(update, 30_000);
    window.addEventListener('focus', update);
    window.addEventListener('notifications:changed', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', update);
      window.removeEventListener('notifications:changed', refresh);
    };
  }, [refresh, user]);

  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'
      }
      className={`relative flex size-11 shrink-0 items-center justify-center rounded-md border transition ${
        dark
          ? 'border-white/12 text-white/72 hover:border-[#00c2e0]/60 hover:text-white'
          : 'border-[#c8d6dc] bg-white text-[#07111f] hover:border-[#008ca6]'
      }`}
    >
      <Bell aria-hidden="true" size={19} strokeWidth={2.2} />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e7ad2d] px-1 text-[10px] font-black text-[#07111f]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
