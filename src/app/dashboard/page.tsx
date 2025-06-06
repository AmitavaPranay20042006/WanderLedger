
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, LayoutGrid, ListFilter, Search, FolderOpen, Loader2, AlertTriangle, MapPin, CalendarDays, ArrowRight } from 'lucide-react';
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
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out group transform hover:-translate-y-1.5 border border-transparent hover:border-primary/30">
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="relative h-52 w-full"> {/* Increased height */}
          <Image
            src={trip.coverPhotoURL}
            alt={trip.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            className="transition-transform duration-500 group-hover:scale-105"
            data-ai-hint={trip.dataAiHint}
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent group-hover:from-black/70 transition-colors"></div>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl group-hover:text-primary transition-colors">{trip.name}</CardTitle>
          <CardDescription className="flex items-center text-sm mt-1">
            <MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" /> {trip.destination}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center">
            <CalendarDays className="h-4 w-4 mr-1.5" />
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)]">
        <Loader2 className="h-20 w-20 animate-spin text-primary mb-6" />
        <p className="text-muted-foreground text-xl">Authenticating user...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)] text-center p-6">
        <AlertTriangle className="h-20 w-20 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground text-lg mb-6">Please log in to access your dashboard.</p>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/login">Go to Login <ArrowRight className="ml-2 h-5 w-5"/></Link>
        </Button>
      </div>
    );
  }

  if (tripsLoading && queryEnabled) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)]">
        <Loader2 className="h-20 w-20 animate-spin text-primary mb-6" />
        <p className="text-muted-foreground text-xl">Loading your adventures...</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <Card className="text-center py-12 shadow-lg border-destructive bg-destructive/5 my-8">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Oops! Something Went Wrong</CardTitle>
          <CardDescription className="text-destructive/80">
            We couldn&apos;t load your trips. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Error: {queryError.message}</p>
          {/* ... (existing error details guidance) ... */}
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
    <div className="space-y-10"> {/* Increased spacing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome, {user?.displayName?.split(' ')[0] || 'Traveler'}!</h1>
          <p className="text-lg text-muted-foreground mt-1">Ready for your next journey? Here are your plans.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 text-base">
          <Link href="/trips/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Trip
          </Link>
        </Button>
      </div>

      <Card className="p-6 shadow-md border"> {/* Enhanced card styling */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search trips by name or destination..."
              className="pl-12 h-12 text-base" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 text-base"> {/* Increased height */}
                <ListFilter className="mr-2 h-5 w-5" />
                <SelectValue placeholder="Filter trips" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trips</SelectItem>
                <SelectItem value="upcoming">Upcoming Trips</SelectItem>
                <SelectItem value="past">Past Trips</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Increased gap */}
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-16 shadow-md border-dashed my-8">
          <CardHeader>
            <div className="mx-auto bg-secondary p-5 rounded-full w-fit mb-6">
              <FolderOpen className="h-16 w-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">
              {searchTerm || filter !== 'all'
                ? "No Trips Match"
                : (trips && trips.length === 0 && !queryError ? "No Adventures Yet!" : "No Trips Found")}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {searchTerm || filter !== 'all'
                ? "Try adjusting your search or filter."
                : (trips && trips.length === 0 && !queryError ? "Time to plan something amazing!" : "Perhaps create a new trip or check back soon.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!(searchTerm || filter !== 'all') && (!trips || trips.length === 0) && !queryError && (
               <Button asChild size="lg" className="mt-4 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 text-base">
                <Link href="/trips/new">
                  <PlusCircle className="mr-2 h-5 w-5" />
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
