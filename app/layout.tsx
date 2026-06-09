import type { Metadata } from 'next';
import { AuthProvider } from '@/context/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nata Connect | నట కనెక్ట్',
  description:
    'A professional talent discovery and casting network for artists and recruiters.',
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
