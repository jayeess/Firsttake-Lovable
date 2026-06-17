import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/auth-context';
import { getConfiguredAppUrl } from '@/app/lib/app-url';
import './globals.css';

const appUrl = getConfiguredAppUrl();

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: 'Nata Connect | నట కనెక్ట్',
  description:
    'A professional talent discovery and casting network for artists and recruiters.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Nata Connect',
    statusBarStyle: 'black-translucent',
  },
  applicationName: 'Nata Connect',
};

export const viewport: Viewport = {
  themeColor: '#008ca6',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
