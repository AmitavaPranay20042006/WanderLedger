
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import { MountainIcon } from 'lucide-react'; // For footer icon
import Link from 'next/link';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-background"> {/* Ensure bg-background is on the main wrapper */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-10 md:py-12"> {/* Increased padding */}
            {children}
          </main>
          <footer className="border-t bg-muted/50">
            <div className="container mx-auto px-4 py-8 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MountainIcon className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">WanderLedger</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} WanderLedger. Adventure Awaits.
              </p>
              <div className="flex gap-4 text-sm">
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
              </div>
            </div>
          </footer>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
