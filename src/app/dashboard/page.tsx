'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle, LayoutGrid, ListFilter, Search, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock trip data for UI development
// In a real app, this would come from Firestore
const mockTrips = [
  { id: '1', name: 'Paris Adventure', destination: 'Paris, France', startDate: '2024-09-15', endDate: '2024-09-22', coverPhotoURL: 'https://placehold.co/600x400.png?text=Paris+View', dataAiHint: 'paris cityscape' },
  { id: '2', name: 'Tokyo Exploration', destination: 'Tokyo, Japan', startDate: '2024-11-01', endDate: '2024-11-10', coverPhotoURL: 'https://placehold.co/600x400.png?text=Tokyo+Skyline', dataAiHint: 'tokyo japan' },
  { id: '3', name: 'Rome Holiday', destination: 'Rome, Italy', startDate: '2025-03-20', endDate: '2025-03-27', coverPhotoURL: 'https://placehold.co/600x400.png?text=Rome+Colosseum', dataAiHint: 'rome colosseum' },
];

type Trip = typeof mockTrips[0];

function TripCard({ trip }: { trip: Trip }) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="relative h-48 w-full">
          <Image 
            src={trip.coverPhotoURL} 
            alt={trip.name} 
            layout="fill" 
            objectFit="cover" 
            data-ai-hint={trip.dataAiHint}
          />
        </div>
        <CardHeader>
          <CardTitle className="text-lg group-hover:text-primary">{trip.name}</CardTitle>
          <CardDescription>{trip.destination}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>(mockTrips); // Use mockTrips for now
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'

  // TODO: Replace with actual data fetching and filtering logic
  const filteredTrips = trips.filter(trip => 
    trip.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(trip => {
    if (filter === 'all') return true;
    const endDate = new Date(trip.endDate);
    if (filter === 'upcoming') return endDate >= new Date();
    if (filter === 'past') return endDate < new Date();
    return true;
  });

  if (!user) {
    // This should ideally be handled by AuthProvider redirect, but as a fallback:
    return <p>Loading user data or redirecting...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.displayName || 'Traveler'}!</h1>
          <p className="text-muted-foreground">Here are your travel plans. Let the adventures begin!</p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/trips/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Trip
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
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
            {/* Add view toggle if needed later: List/Grid */}
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
            <CardTitle className="text-2xl">No Trips Yet!</CardTitle>
            <CardDescription>
              {searchTerm || filter !== 'all' 
                ? "No trips match your current search or filter criteria." 
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
