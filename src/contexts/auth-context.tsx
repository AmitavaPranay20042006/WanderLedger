
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'; // Removed updateDoc as setDoc with merge handles updates
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
    console.log('AuthProvider: Subscribing to onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        console.log('AuthProvider: onAuthStateChanged triggered. currentUser UID:', currentUser?.uid || 'null');
        setUser(currentUser);

        if (currentUser) {
          console.log('AuthProvider: User found (UID: %s). Preparing to write/update Firestore document.', currentUser.uid);
          const userDocRef = doc(db, 'users', currentUser.uid);
          try {
            const emailToStore = currentUser.email?.toLowerCase() || '';
            const displayNameToStore = currentUser.displayName || currentUser.email?.split('@')[0] || `User_${currentUser.uid.substring(0, 5)}`;
            const photoURLToStore = currentUser.photoURL || `https://placehold.co/100x100.png?text=${(displayNameToStore[0] || 'U').toUpperCase()}`;

            const userDataPayload: { [key: string]: any } = {
              uid: currentUser.uid,
              email: emailToStore,
              displayName: displayNameToStore,
              photoURL: photoURLToStore,
              lastLogin: serverTimestamp(),
            };

            // Check if document exists to conditionally add createdAt
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists()) {
              userDataPayload.createdAt = serverTimestamp();
              console.log('AuthProvider: User document for UID %s does not exist. Will create with createdAt.', currentUser.uid);
            } else {
              console.log('AuthProvider: User document for UID %s exists. Will update (merge).', currentUser.uid);
            }

            await setDoc(userDocRef, userDataPayload, { merge: true });
            console.log('AuthProvider: User document written/updated successfully for UID:', currentUser.uid);

          } catch (dbError: any) {
            console.error("AuthProvider: Error saving user to Firestore for UID %s:", currentUser.uid, dbError);
            console.error("Firestore Error Code:", dbError.code);
            console.error("Firestore Error Message:", dbError.message);
            setError(dbError);
          }
        } else {
          console.log('AuthProvider: No current user (signed out).');
        }
        setLoading(false);
      },
      (err) => { // Error callback for onAuthStateChanged subscription itself
        console.error('AuthProvider: onAuthStateChanged subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      console.log('AuthProvider: Unsubscribing from onAuthStateChanged');
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Moved redirect logic to a separate useEffect
  useEffect(() => {
    if (loading) {
      console.log('AuthProvider (Redirect Logic): Auth state still loading, skipping redirect checks.');
      return; 
    }

    const publicPaths = ['/', '/login', '/signup'];
    const isAuthPath = pathname === '/login' || pathname === '/signup';

    console.log(`AuthProvider (Redirect Logic): User: ${user?.uid || 'null'}, Path: ${pathname}, AuthLoading: ${loading}`);

    if (!user && !publicPaths.includes(pathname)) {
      console.log(`AuthProvider (Redirect Logic): No user, not a public path (${pathname}). Redirecting to /login.`);
      router.push('/login');
    } else if (user && isAuthPath) {
      console.log(`AuthProvider (Redirect Logic): User exists, on auth path (${pathname}). Redirecting to /dashboard.`);
      router.push('/dashboard');
    } else {
      console.log('AuthProvider (Redirect Logic): No redirect conditions met for current state.');
    }
  }, [user, loading, pathname, router]);


  if (loading) {
    console.log('AuthProvider (Render): Auth loading, rendering skeleton UI.');
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

  // These checks prevent rendering children if a redirect is imminent
  const publicPaths = ['/', '/login', '/signup'];
  const isAuthPath = pathname === '/login' || pathname === '/signup';
  if (!loading && !user && !publicPaths.includes(pathname)) {
     console.log('AuthProvider (Render): No user, protected path, redirect imminent. Returning null.');
     return null; 
  }
  if (!loading && user && isAuthPath) {
     console.log('AuthProvider (Render): User on auth path, redirect imminent. Returning null.');
     return null; 
  }

  console.log('AuthProvider (Render): Auth loaded, rendering children. User:', user?.uid || 'null');
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
