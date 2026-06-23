'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#07111f',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#00c2e0',
            }}
          >
            Nata Connect
          </p>
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: '30px',
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            Something went wrong.
          </h1>
          <p
            style={{
              margin: '0 0 32px',
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            We ran into an unexpected problem. Reloading the page usually fixes
            it. If the problem continues, our team has been notified.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#008ca6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
