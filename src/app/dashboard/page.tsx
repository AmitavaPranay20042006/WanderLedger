
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, LayoutGrid, ListFilter, Search, FolderOpen, Loader2, AlertTriangle, MapPin, CalendarDays, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

type Trip = {
  id: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  coverPhotoURL: string;
  dataAiHint: string;
};

async function fetchUserTrips(userId: string | undefined | null): Promise<Trip[]> {
  if (!userId) return [];
  const tripsRef = collection(db, 'trips');
  const q = query(
    tripsRef,
    where('members', 'array-contains', userId),
    orderBy('startDate', 'desc')
  );

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        destination: data.destination,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        coverPhotoURL: data.coverPhotoURL || 'https://placehold.co/600x400.png',
        dataAiHint: data.dataAiHint || `${data.destination?.split(',')[0].trim().toLowerCase() || 'trip'} photo`,
      } as Trip;
    });
  } catch (error) {
    console.error("fetchUserTrips - Error executing getDocs(q):", error);
    throw error; 
  }
}

function TripCard({ trip }: { trip: Trip }) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl dark:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-300 ease-in-out group transform hover:-translate-y-2 border border-transparent hover:border-primary/30 dark:bg-card/80 dark:hover:border-primary/50">
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="relative h-56 w-full group-hover:opacity-95 transition-opacity"> {/* Increased height */}
          <Image
            src={trip.coverPhotoURL}
            alt={trip.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            className="transition-transform duration-500 group-hover:scale-105"
            data-ai-hint={trip.dataAiHint}
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent group-hover:from-black/75 transition-colors"></div>
           <div className="absolute top-3 right-3 bg-accent/80 text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 flex items-center">
            <Star className="h-3.5 w-3.5 mr-1 fill-current" /> Popular Pick
           </div>
        </div>
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">{trip.name}</CardTitle>
          <CardDescription className="flex items-center text-sm mt-1.5 text-muted-foreground group-hover:text-foreground/90 transition-colors">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary/80 transition-colors" /> {trip.destination}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-5">
          <p className="text-sm text-muted-foreground flex items-center group-hover:text-foreground/80 transition-colors">
            <CalendarDays className="h-4 w-4 mr-2" />
            {trip.startDate.toLocaleDateString()} - {trip.endDate.toLocaleDateString()}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); 

  const queryEnabled = !!user && !!user.uid && !authLoading;

  const { data: trips, isLoading: tripsLoading, error: queryError } = useQuery<Trip[], Error>({
    queryKey: ['trips', user?.uid],
    queryFn: () => {
      if (!user?.uid) return Promise.resolve([]);
      return fetchUserTrips(user.uid);
    },
    enabled: queryEnabled,
  });

  if (authLoading) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-24 w-24 animate-spin text-primary mb-8" />
        <p className="text-muted-foreground text-xl">Authenticating user...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] text-center p-6">
        <AlertTriangle className="h-24 w-24 text-destructive mb-8" />
        <h2 className="text-3xl font-semibold mb-3">Authentication Required</h2>
        <p className="text-muted-foreground text-lg mb-8">Please log in to access your dashboard and embark on new adventures.</p>
        <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground group">
            <Link href="/login">Go to Login <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform"/></Link>
        </Button>
      </div>
    );
  }

  if (tripsLoading && queryEnabled) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-24 w-24 animate-spin text-primary mb-8" />
        <p className="text-muted-foreground text-xl">Loading your adventures...</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <Card className="text-center py-16 shadow-xl border-destructive bg-destructive/5 my-10">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-5 rounded-full w-fit mb-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-3xl text-destructive">Oops! Something Went Wrong</CardTitle>
          <CardDescription className="text-destructive/80 text-lg mt-2">
            We couldn&apos;t load your trips. Please try refreshing or check back later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Error: {queryError.message}</p>
        </CardContent>
      </Card>
    );
  }

  const tripsToDisplay = trips || [];

  const filteredTrips = tripsToDisplay.filter(trip =>
    trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(trip => {
    if (filter === 'all') return true;
    const endDate = trip.endDate;
    if (filter === 'upcoming') return endDate >= new Date();
    if (filter === 'past') return endDate < new Date(new Date().setHours(0,0,0,0));
    return true;
  });

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Welcome, {user?.displayName?.split(' ')[0] || 'Traveler'}!</h1>
          <p className="text-xl text-muted-foreground mt-2">Ready for your next journey? Here are your plans.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 text-base px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground group">
          <Link href="/trips/new">
            <PlusCircle className="mr-2.5 h-5 w-5 group-hover:animate-subtle-pulse" />
            Create New Trip
          </Link>
        </Button>
      </div>

      <Card className="p-6 shadow-lg border dark:bg-card/80">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search trips by name or destination..."
              className="pl-12 h-14 text-base rounded-lg" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[220px] h-14 text-base rounded-lg">
                <ListFilter className="mr-2.5 h-5 w-5" />
                <SelectValue placeholder="Filter trips" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-xl">
                <SelectItem value="all" className="py-2.5">All Trips</SelectItem>
                <SelectItem value="upcoming" className="py-2.5">Upcoming Trips</SelectItem>
                <SelectItem value="past" className="py-2.5">Past Trips</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"> {/* Increased gap */}
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-20 shadow-lg border-dashed border-border/70 dark:bg-card/50 my-10">
          <CardHeader>
            <div className="mx-auto bg-muted/70 dark:bg-muted/30 p-6 rounded-full w-fit mb-8">
              <FolderOpen className="h-20 w-20 text-muted-foreground" />
            </div>
            <CardTitle className="text-4xl">
              {searchTerm || filter !== 'all'
                ? "No Trips Match Your Criteria"
                : (trips && trips.length === 0 && !queryError ? "No Adventures Yet!" : "No Trips Found")}
            </CardTitle>
            <CardDescription className="text-lg mt-3 text-muted-foreground">
              {searchTerm || filter !== 'all'
                ? "Try adjusting your search or filter settings."
                : (trips && trips.length === 0 && !queryError ? "Time to plan something amazing and fill this space!" : "Perhaps create a new trip or check back soon.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!(searchTerm || filter !== 'all') && (!trips || trips.length === 0) && !queryError && (
               <Button asChild size="lg" className="mt-6 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 text-base px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground group">
                <Link href="/trips/new">
                  <PlusCircle className="mr-2.5 h-5 w-5 group-hover:animate-subtle-pulse" />
                  Plan Your First Trip
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
