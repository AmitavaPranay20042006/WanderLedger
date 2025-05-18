
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, LayoutGrid, ListFilter, Search, FolderOpen, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
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
  // Add other fields if needed, e.g., ownerId, members array
};

async function fetchUserTrips(userId: string | undefined): Promise<Trip[]> {
  if (!userId) return [];
  const tripsRef = collection(db, 'trips');
  const q = query(
    tripsRef,
    where('members', 'array-contains', userId),
    orderBy('startDate', 'desc') // You can also order by 'createdAt'
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      destination: data.destination,
      startDate: (data.startDate as Timestamp).toDate(), // Convert Firestore Timestamp to JS Date
      endDate: (data.endDate as Timestamp).toDate(),     // Convert Firestore Timestamp to JS Date
      coverPhotoURL: data.coverPhotoURL,
      dataAiHint: data.dataAiHint || `${data.destination?.split(',')[0].trim().toLowerCase() || 'trip'} photo`, // Fallback AI hint
    } as Trip;
  });
}

function TripCard({ trip }: { trip: Trip }) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="relative h-48 w-full">
          <Image 
            src={trip.coverPhotoURL} 
            alt={trip.name} 
            fill // Replaces layout="fill" objectFit="cover" in Next.js 13+
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes, adjust as needed
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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'

  const { data: trips, isLoading, error: queryError } = useQuery<Trip[], Error>({
    queryKey: ['trips', user?.uid],
    queryFn: () => fetchUserTrips(user?.uid),
    enabled: !!user, // Only run query if user is available
  });

  if (!user && !isLoading) { // Added !isLoading to prevent flash of this message
    return <p>Loading user data or redirecting...</p>;
  }
  
  if (isLoading) {
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
    const endDate = trip.endDate; // Already a Date object
    if (filter === 'upcoming') return endDate >= new Date();
    if (filter === 'past') return endDate < new Date(new Date().setHours(0,0,0,0)); // Compare with start of today for 'past'
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
                : "No Trips Yet!"}
            </CardTitle>
            <CardDescription>
              {searchTerm || filter !== 'all' 
                ? "Try adjusting your search or filter criteria." 
                : "It looks like you haven't created or joined any trips. Start your next adventure now!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!(searchTerm || filter !== 'all') && (
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
