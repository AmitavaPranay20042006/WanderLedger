
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';

export function AppProviders({ children }: { children: ReactNode }) {
  // useState ensures QueryClient is only created once per component instance,
  // and on the client side.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-muted py-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} WanderLedger. All rights reserved.
          </footer>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
