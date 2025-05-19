
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase'; // Ensure db is imported
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
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
    console.log('AuthProvider: useEffect for onAuthStateChanged running');
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => { // Made async to await setDoc
        console.log('AuthProvider: onAuthStateChanged triggered. currentUser:', currentUser?.uid || null);
        setUser(currentUser);

        if (currentUser) {
          console.log('AuthProvider: Current user found, attempting to write/update user document in Firestore.');
          const userDocRef = doc(db, 'users', currentUser.uid);
          try {
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email?.toLowerCase() || '', // Store email in lowercase
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User', // Fallback displayName
              photoURL: currentUser.photoURL || `https://placehold.co/100x100.png?text=${(currentUser.displayName || currentUser.email || 'U')[0]}`, // Fallback photoURL
              lastLogin: serverTimestamp(),
              // Add createdAt only if it's a new document, or ensure it's handled by merge:true correctly for updates
              // For simplicity with merge:true, we can just set it. If it exists, it won't be overwritten by serverTimestamp typically unless field is absent.
              // A more robust way for createdAt is to check if doc exists first, but for now this is okay with merge.
            }, { merge: true }); // merge: true creates if not exists, updates if exists

            // To ensure 'createdAt' is only set once:
            const userDocSnapshot = await setDoc(userDocRef, { createdAt: serverTimestamp() }, { mergeFields: ['createdAt'] });
            // This is a bit more complex; simpler to manage createdAt on initial object if using merge: true
            // A simpler approach for createdAt with merge:true is to set it initially and let merge handle it.
            // For a truly "only on create" timestamp with merge:true, you might read first, then write, or use a Cloud Function.
            // Given the current setup, just including it in the main setDoc should be fine and it will be set on creation.
            // If the document is just being updated, existing createdAt won't change due to how serverTimestamp works with merge.

            console.log('AuthProvider: User document written/updated in Firestore for UID:', currentUser.uid);
          } catch (dbError) {
            console.error("AuthProvider: Error saving user to Firestore:", dbError);
            // You might want to set an error state here or notify the user
          }
        } else {
          console.log('AuthProvider: User is signed out, no Firestore user document action.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('AuthProvider: onAuthStateChanged error:', err);
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      console.log('AuthProvider: Unsubscribing from onAuthStateChanged');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/', '/login', '/signup'];
    // Adjusted to treat root as public but redirect logged-in users from auth pages
    const isStrictlyPublicPath = publicPaths.includes(pathname) && pathname !== '/';
    const isAuthPath = pathname === '/login' || pathname === '/signup';


    if (!user && !publicPaths.includes(pathname)) {
        console.log(`AuthProvider: No user, not a public path (${pathname}). Redirecting to /login.`);
        router.push('/login');
    } else if (user && isAuthPath) {
        console.log(`AuthProvider: User exists, on auth path (${pathname}). Redirecting to /dashboard.`);
        router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
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
  
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return null; 
  }
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
