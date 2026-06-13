'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function PublicProfileShareButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      className="secondary-button inline-flex items-center gap-2"
    >
      {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
      {copied ? 'Copied' : 'Copy profile link'}
    </button>
  );
}
