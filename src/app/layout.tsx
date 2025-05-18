
import type { Metadata } from 'next';
// Removed: import { Open_Sans } from 'next/font/google';
import './globals.css';
// Toaster, AuthProvider, Header, QueryClientProvider are now managed by AppProviders
import { AppProviders } from '@/components/providers/app-providers';

// Removed:
// const openSans = Open_Sans({
//   subsets: ['latin'],
//   variable: '--font-open-sans',
// });

export const metadata: Metadata = {
  title: 'WanderLedger - Collaborative Travel Planning',
  description: 'Effortlessly manage trip finances, itineraries, and packing lists with your group.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Removed openSans.variable from className
    <html lang="en">
      <body className="antialiased">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
