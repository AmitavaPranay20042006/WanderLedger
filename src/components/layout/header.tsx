
'use client';

import Link from 'next/link';
import { Home, LogIn, LogOut, UserPlus, LayoutDashboard, PlusCircle, MountainIcon, Settings } from 'lucide-react'; // Added Settings
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md shadow-sm"> {/* Added shadow-sm and backdrop-blur */}
      <div className="container flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8"> {/* Increased height */}
        <Link href="/" className="flex items-center gap-2 text-primary group">
          <MountainIcon className="h-7 w-7 transition-transform duration-300 group-hover:rotate-[15deg]" /> {/* Slightly larger icon and hover effect */}
          <span className="font-bold text-xl sm:text-2xl tracking-tight">WanderLedger</span>
        </Link>
        <nav className="flex items-center space-x-2 sm:space-x-3">
          {loading ? (
             <div className="flex items-center space-x-3">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ) : user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-primary">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Dashboard
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"> {/* Larger avatar trigger */}
                    <Avatar className="h-11 w-11 border-2 border-transparent hover:border-primary/50 transition-colors">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} data-ai-hint="user avatar" />
                      <AvatarFallback className="text-base">{getInitials(user.displayName || user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-2 px-3">
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
                    <DropdownMenuItem onClick={() => router.push('/dashboard')} className="py-2">
                      <LayoutDashboard className="mr-2.5 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/trips/new')} className="py-2">
                      <PlusCircle className="mr-2.5 h-4 w-4" />
                      <span>Create New Trip</span>
                    </DropdownMenuItem>
                    {/* Example for a future settings page */}
                    {/* <DropdownMenuItem onClick={() => router.push('/settings')} className="py-2">
                      <Settings className="mr-2.5 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem> */}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-500 dark:hover:!text-red-500 dark:focus:text-red-500 dark:focus:bg-red-500/10 py-2">
                    <LogOut className="mr-2.5 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="px-4 text-muted-foreground hover:text-primary">
                <Link href="/login">
                  <LogIn className="mr-0 sm:mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
              <Button asChild className="px-5 py-2.5 text-sm">
                <Link href="/signup">
                  <UserPlus className="mr-0 sm:mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
