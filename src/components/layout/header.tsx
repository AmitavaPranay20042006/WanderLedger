
'use client';

import Link from 'next/link';
import { LayoutDashboard, PlusCircle, MountainIcon, LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg shadow-sm">
      <div className="container flex h-[72px] items-center justify-between"> {/* Increased height */}
        <Link href="/" className="flex items-center gap-2.5 text-primary group">
          <MountainIcon className="h-8 w-8 transition-all duration-300 group-hover:rotate-[15deg] group-hover:scale-110 text-primary" />
          <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">WanderLedger</span>
        </Link>
        <nav className="flex items-center space-x-2 sm:space-x-3">
          {loading ? (
             <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-28 rounded-md" /> {/* Adjusted size */}
                <Skeleton className="h-11 w-11 rounded-full" /> {/* Adjusted size */}
            </div>
          ) : user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2.5 rounded-lg">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Dashboard
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all duration-150 hover:scale-105 active:scale-95">
                    <Avatar className="h-12 w-12 border-2 border-primary/30 group-hover:border-primary transition-colors">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} data-ai-hint="user avatar" />
                      <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{getInitials(user.displayName || user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2 shadow-xl rounded-xl border-border/70" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-2.5 px-3.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-foreground">
                        {user.displayName || 'Valued Traveler'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/dashboard')} className="py-2.5 px-3.5 text-sm hover:bg-muted/80">
                      <LayoutDashboard className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/trips/new')} className="py-2.5 px-3.5 text-sm hover:bg-muted/80">
                      <PlusCircle className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>Create New Trip</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive hover:!text-destructive focus:text-destructive focus:bg-destructive/10 py-2.5 px-3.5 text-sm font-medium">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="px-5 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg">
                <Link href="/login">
                  <LogIn className="mr-0 sm:mr-2 h-5 w-5" />
                  <span className="hidden sm:inline font-medium">Login</span>
                </Link>
              </Button>
              <Button asChild className="px-6 py-2.5 text-sm shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/90 rounded-lg">
                <Link href="/signup">
                  <UserPlus className="mr-0 sm:mr-2 h-5 w-5" />
                  <span className="hidden sm:inline font-semibold">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
