'use client';

import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createConversation } from '@/app/lib/messaging-client';

export function ApplicationMessageButton({
  auditionId,
  applicationId,
  label,
  disabled = false,
  className = '',
}: {
  auditionId: string;
  applicationId: string;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <div>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const result = await createConversation(auditionId, applicationId);
            router.push(`/messages/${result.conversationId}`);
          } catch {
            setError('Conversation could not be opened. Try again in a moment.');
          } finally {
            setBusy(false);
          }
        }}
        className={`secondary-button inline-flex items-center justify-center gap-2 disabled:opacity-45 ${className}`}
      >
        <MessageSquare aria-hidden="true" size={17} />
        {busy ? 'Opening...' : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
