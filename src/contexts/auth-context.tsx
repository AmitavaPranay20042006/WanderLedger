'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/', '/login', '/signup'];
    const isPublicPath = publicPaths.includes(pathname);
    const isAuthPath = pathname === '/login' || pathname === '/signup';

    if (!user && !isPublicPath) {
      router.push('/login');
    } else if (user && isAuthPath) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
     // Show a global loading state or skeleton screen
     return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
        <footer className="bg-muted py-6 text-center text-sm text-muted-foreground">
          <Skeleton className="h-5 w-1/3 mx-auto" />
        </footer>
      </div>
    );
  }
  
  // Prevent rendering children on auth pages if user is already logged in and redirecting
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return null; 
  }
  // Prevent rendering children on protected pages if user is not logged in and redirecting
  if (!user && !['/', '/login', '/signup'].includes(pathname)) {
     return null;
  }


  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
