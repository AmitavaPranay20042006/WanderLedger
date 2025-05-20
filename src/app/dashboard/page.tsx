
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, LayoutGrid, ListFilter, Search, FolderOpen, Loader2, AlertTriangle } from 'lucide-react';
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
  console.log("fetchUserTrips: Initiated with userId:", userId);
  if (!userId) {
    console.warn("fetchUserTrips: No userId provided (it's undefined or null), returning empty array. Query will not run.");
    return [];
  }
  console.log(`fetchUserTrips: Fetching trips for valid userId: ${userId}`);
  const tripsRef = collection(db, 'trips');
  const q = query(
    tripsRef,
    where('members', 'array-contains', userId),
    orderBy('startDate', 'desc')
  );
  console.log("fetchUserTrips - Query being prepared:", q);

  try {
    const querySnapshot = await getDocs(q);
    console.log(`fetchUserTrips - Query successful. Number of documents received: ${querySnapshot.docs.length}`);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        destination: data.destination,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        coverPhotoURL: data.coverPhotoURL,
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
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="relative h-48 w-full">
          <Image
            src={trip.coverPhotoURL}
            alt={trip.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            data-ai-hint={trip.dataAiHint}
          />
        </div>
        <CardHeader>
          <CardTitle className="text-lg group-hover:text-primary">{trip.name}</CardTitle>
          <CardDescription>{trip.destination}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
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
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'

  useEffect(() => {
    console.log("DashboardPage - User from useAuth():", JSON.stringify(user, null, 2));
    console.log("DashboardPage - Auth loading state:", authLoading);
  }, [user, authLoading]);

  const queryEnabled = !!user && !!user.uid && !authLoading;

  const { data: trips, isLoading: tripsLoading, error: queryError } = useQuery<Trip[], Error>({
    queryKey: ['trips', user?.uid],
    queryFn: () => {
      console.log(`DashboardPage - useQuery queryFn called. User UID: ${user?.uid}`);
      if (!user?.uid) {
        console.warn("DashboardPage - useQuery queryFn: user.uid is not available, returning Promise<[]>.");
        return Promise.resolve([]);
      }
      return fetchUserTrips(user.uid);
    },
    enabled: queryEnabled,
  });

  useEffect(() => {
    if (queryError) {
      console.error("DashboardPage - Error fetching trips (from useQuery error object):", queryError);
      console.error("DashboardPage - User ID at the time of query that failed:", user?.uid);
      console.error("DashboardPage - Error name:", queryError.name);
      console.error("DashboardPage - Error message:", queryError.message);
      if ('code' in queryError && (queryError as any).code) { // Check if code exists and is not empty
        console.error("DashboardPage - Firebase error code:", (queryError as any).code);
      }
    }
  }, [queryError, user?.uid]);


  if (authLoading) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-lg">Authenticating user...</p>
      </div>
    );
  }

  if (!user && !authLoading) { // If auth is done, but no user
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-muted-foreground text-lg">User not authenticated. Please log in.</p>
        <Button asChild className="mt-4">
            <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  if (tripsLoading && queryEnabled) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-lg">Loading your adventures...</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <Card className="text-center py-12 shadow-lg border-destructive bg-destructive/5">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Oops! Something Went Wrong</CardTitle>
          <CardDescription className="text-destructive/80">
            We couldn&apos;t load your trips at the moment. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Error: {queryError.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            This might be due to a "Missing or insufficient permissions" error from Firestore.
            Please check the following:
            <br />1. **Firestore Index:** Ensure the composite index for `trips` collection (`members` Array, `startDate` Descending) is active in your Firebase console. The browser console might have a direct link to create it if missing.
            <br />2. **Data Consistency:** In your `trips` collection, verify that for user ID <code className="bg-muted px-1 rounded">{user?.uid}</code>, this ID is present in the `members` array of the trips they should see. Also, ensure all trip documents have a `members` field which is an array, and a `startDate` field which is a Timestamp.
            <br />3. **Firestore Rules:** Confirm your Firestore security rules for reading `/trips/tripId` (replace tripId with the actual ID placeholder) correctly allow access if `request.auth.uid in resource.data.members`.
            <br />Check the browser console for more detailed Firebase error messages.
          </p>
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
    if (filter === 'past') return endDate < new Date(new Date().setHours(0,0,0,0)); // Compare against start of today
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.displayName || 'Traveler'}!</h1>
          <p className="text-muted-foreground">Here are your travel plans. Let the adventures begin!</p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/trips/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Trip
          </Link>
        </Button>
      </div>

      <Card className="p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search trips by name or destination..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter trips" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trips</SelectItem>
                <SelectItem value="upcoming">Upcoming Trips</SelectItem>
                <SelectItem value="past">Past Trips</SelectItem>
              </SelectContent>
            </Select>
            {/* Optional: Add a grid/list view toggle if needed later */}
            {/* <Button variant="outline" size="icon"><LayoutGrid className="h-5 w-5" /></Button> */}
          </div>
        </div>
      </Card>

      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full text-center py-12 shadow-sm">
          <CardHeader>
            <div className="mx-auto bg-secondary p-4 rounded-full w-fit mb-4">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {searchTerm || filter !== 'all'
                ? "No Trips Match Your Search"
                : (trips && trips.length === 0 && !queryError ? "No Trips Yet!" : "Loading Trips or No Trips Found")}
            </CardTitle>
            <CardDescription>
              {searchTerm || filter !== 'all'
                ? "Try adjusting your search or filter criteria."
                : (trips && trips.length === 0 && !queryError ? "It looks like you haven't created or joined any trips. Start your next adventure now!" : "If you've just created a trip, it might take a moment to appear.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!(searchTerm || filter !== 'all') && (!trips || trips.length === 0) && !queryError && (
               <Button asChild className="shadow-md hover:shadow-lg transition-shadow">
                <Link href="/trips/new">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Your First Trip
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

