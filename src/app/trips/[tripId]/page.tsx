
'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, ListChecks, MapPin, PlusCircle, BarChart3, Sparkles, FileText, CalendarDays, Settings, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueries } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp as FirestoreTimestamp } from 'firebase/firestore'; // Renamed to avoid conflict
import type { User as FirebaseUser } from 'firebase/auth'; // For user details
import { useAuth } from '@/contexts/auth-context';

// --- Data Types ---
interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  description: string;
  coverPhotoURL: string;
  dataAiHint: string;
  ownerId: string;
  members: string[]; // Array of user UIDs
  // Calculated or denormalized fields (optional, can be calculated client-side or via functions)
  totalExpenses?: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // User UID
  paidByName?: string; // Denormalized or fetched
  date: Date;
  category: string;
  participants?: string[]; // Array of user UIDs
}

interface ItineraryEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: string; // e.g., 'Activity', 'Travel', 'Accommodation'
  location?: string;
  notes?: string;
}

interface PackingListItem {
  id: string;
  name: string;
  packed: boolean;
  assignee?: string; // User UID
  assigneeName?: string; // Denormalized or fetched
}

interface Member {
  id: string; // UID
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
}


// --- Data Fetching Functions ---
async function fetchTripDetails(tripId: string): Promise<Trip | null> {
  if (!tripId) return null;
  const tripRef = doc(db, 'trips', tripId);
  const tripSnap = await getDoc(tripRef);

  if (tripSnap.exists()) {
    const data = tripSnap.data();
    return {
      id: tripSnap.id,
      name: data.name,
      destination: data.destination,
      startDate: (data.startDate as FirestoreTimestamp).toDate(),
      endDate: (data.endDate as FirestoreTimestamp).toDate(),
      description: data.description,
      coverPhotoURL: data.coverPhotoURL,
      dataAiHint: data.dataAiHint,
      ownerId: data.ownerId,
      members: data.members || [],
    } as Trip;
  }
  return null;
}

async function fetchSubCollection<T>(tripId: string, subCollectionName: string, idField: string = 'id', orderByField?: string, orderByDirection: 'asc' | 'desc' = 'desc'): Promise<T[]> {
  if (!tripId) return [];
  const subCollectionRef = collection(db, 'trips', tripId, subCollectionName);
  const q = orderByField ? query(subCollectionRef, orderBy(orderByField, orderByDirection)) : query(subCollectionRef);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    // Convert Firestore Timestamps to JS Dates for relevant fields
    if (data.date && data.date instanceof FirestoreTimestamp) {
      data.date = data.date.toDate();
    }
    return { ...data, [idField]: docSnap.id } as T;
  });
}

async function fetchMemberDetails(userId: string): Promise<Member | null> {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId); // Assuming a 'users' collection
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      displayName: data.displayName || 'Unknown User',
      photoURL: data.photoURL || `https://placehold.co/40x40.png?text=${data.displayName?.[0] || 'U'}`,
      email: data.email || '',
    } as Member;
  }
  return { id: userId, displayName: 'Unknown User', photoURL: `https://placehold.co/40x40.png?text=U` }; // Fallback
}


// --- Tab Components ---

interface TripDataProps {
  trip: Trip;
  currentUser: FirebaseUser | null;
}

function TripOverviewTab({ trip, expenses, currentUser }: { trip: Trip; expenses: Expense[] | undefined; currentUser: FirebaseUser | null}) {
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const yourSpending = expenses?.filter(exp => exp.paidBy === currentUser?.uid).reduce((sum, exp) => sum + exp.amount, 0) || 0;
  // Net balance calculation is complex and depends on expense splitting logic (not implemented yet)
  // For now, showing a placeholder or simple version
  const netBalance = 0; // Placeholder

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trip Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
            <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Your Spending</h3>
            <p className="text-2xl font-bold">${yourSpending.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Your Net Balance</h3>
            <p className={`text-2xl font-bold ${netBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {/* Placeholder until proper calculation */}
              ${netBalance.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{trip.description || "No description provided for this trip."}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpensesTab({ tripId, expenses, members }: { tripId: string; expenses: Expense[] | undefined, members: Member[] | undefined }) {
  const getMemberName = (uid: string) => members?.find(m => m.id === uid)?.displayName || uid;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Expenses</h2>
        <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"><PlusCircle className="mr-2 h-4 w-4" /> Add Expense</Button>
      </div>
      {expenses && expenses.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {expenses.map(exp => (
                <li key={exp.id} className="p-4 hover:bg-muted/50">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <p className="font-medium">{exp.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid by {getMemberName(exp.paidBy)} on {exp.date.toLocaleDateString()} - ${exp.amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="mt-2 sm:mt-0">{exp.category || 'Uncategorized'}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-8 shadow-sm">
            <CardContent>
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No expenses recorded yet for this trip.</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to add one!</p>
            </CardContent>
        </Card>
      )}
      <Button variant="secondary" className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow">
        <Sparkles className="mr-2 h-4 w-4" /> Suggest Debt Settlement (AI)
      </Button>
    </div>
  );
}

function MembersTab({ tripId, members }: { tripId: string; members: Member[] | undefined }) {
    const { user: currentUser } = useAuth();
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Trip Members ({members?.length || 0})</h2>
        <Button variant="outline" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"><PlusCircle className="mr-2 h-4 w-4" /> Invite Member</Button>
      </div>
      {members && members.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {members.map(member => (
                <li key={member.id} className="p-4 flex items-center space-x-3 hover:bg-muted/50">
                  <Image 
                    src={member.photoURL || `https://placehold.co/40x40.png?text=${member.displayName?.[0] || 'M'}`} 
                    alt={member.displayName || 'Member'} 
                    width={40} height={40} 
                    className="rounded-full" 
                    data-ai-hint="person avatar"
                  />
                  <div>
                    <p className="font-medium">{member.displayName || member.id}</p>
                    <p className="text-sm text-muted-foreground">{member.id === currentUser?.uid ? 'You' : 'Member'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-8 shadow-sm">
            <CardContent>
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No members found for this trip.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItineraryTab({ tripId, itineraryEvents }: { tripId: string, itineraryEvents: ItineraryEvent[] | undefined }) {
 return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Itinerary</h2>
        <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"><PlusCircle className="mr-2 h-4 w-4" /> Add Event</Button>
      </div>
      {itineraryEvents && itineraryEvents.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {itineraryEvents.map(event => (
                <li key={event.id} className="p-4 hover:bg-muted/50">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date.toLocaleDateString()} {event.time ? `- ${event.time}` : ''} - {event.type}
                  </p>
                  {event.location && <p className="text-xs text-muted-foreground/80 mt-1">Location: {event.location}</p>}
                  {event.notes && <p className="text-xs text-muted-foreground/80 mt-1">Notes: {event.notes}</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
         <Card className="text-center py-8 shadow-sm">
            <CardContent>
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No itinerary items added yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Start planning your activities!</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

function PackingListTab({ tripId, packingItems }: { tripId: string, packingItems: PackingListItem[] | undefined }) {
  const totalItems = packingItems?.length || 0;
  const packedItems = packingItems?.filter(item => item.packed).length || 0;
  const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

 return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Packing List ({packedItems}/{totalItems} packed)</h2>
        <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
      </div>
      <Card className="shadow-sm">
        <CardContent className="pt-6"> {/* Added pt-6 for padding */}
          {totalItems > 0 && (
            <div className="w-full bg-muted rounded-full h-2.5 mb-4 shadow-inner">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          {packingItems && packingItems.length > 0 ? (
            <ul className="divide-y">
              {packingItems.map(item => (
                <li key={item.id} className="py-3 flex justify-between items-center hover:bg-muted/50 px-1">
                  <span className={`${item.packed ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>
                  {/* TODO: Add checkbox to toggle packed status */}
                  <Badge variant={item.packed ? "secondary" : "outline"}>
                    {item.packed ? "Packed" : "To Pack"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
                 <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your packing list is empty.</p>
                <p className="text-sm text-muted-foreground mt-1">Add items you need for the trip!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page Component ---
export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user: currentUser } = useAuth();

  const { data: trip, isLoading: isLoadingTrip, error: errorTrip } = useQuery<Trip | null, Error>({
    queryKey: ['tripDetails', tripId],
    queryFn: () => fetchTripDetails(tripId),
    enabled: !!tripId,
  });

  const { data: expenses, isLoading: isLoadingExpenses, error: errorExpenses } = useQuery<Expense[], Error>({
    queryKey: ['tripExpenses', tripId],
    queryFn: () => fetchSubCollection<Expense>(tripId, 'expenses', 'id', 'date'),
    enabled: !!tripId,
  });
  
  const { data: itineraryEvents, isLoading: isLoadingItinerary, error: errorItinerary } = useQuery<ItineraryEvent[], Error>({
    queryKey: ['tripItinerary', tripId],
    queryFn: () => fetchSubCollection<ItineraryEvent>(tripId, 'itineraryEvents', 'id', 'date', 'asc'),
    enabled: !!tripId,
  });

  const { data: packingItems, isLoading: isLoadingPacking, error: errorPacking } = useQuery<PackingListItem[], Error>({
    queryKey: ['tripPackingList', tripId],
    queryFn: () => fetchSubCollection<PackingListItem>(tripId, 'packingItems', 'id', 'name', 'asc'),
    enabled: !!tripId,
  });

  const memberUIDs = trip?.members || [];
  const memberQueries = useQueries({
    queries: memberUIDs.map(uid => ({
      queryKey: ['memberDetails', uid],
      queryFn: () => fetchMemberDetails(uid),
      enabled: !!uid,
      staleTime: Infinity, // User details don't change often
    })),
  });

  const members = memberQueries.every(q => q.isSuccess) 
                ? memberQueries.map(q => q.data).filter(Boolean) as Member[] 
                : undefined;
  const isLoadingMembers = memberQueries.some(q => q.isLoading);
  const errorMembers = memberQueries.find(q => q.error)?.error;


  if (isLoadingTrip || isLoadingMembers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-lg">Loading trip details...</p>
      </div>
    );
  }

  if (errorTrip || !trip) {
    return (
      <Card className="text-center py-12 shadow-lg border-destructive bg-destructive/5">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            {errorTrip ? "Error Loading Trip" : "Trip Not Found"}
          </CardTitle>
          <CardDescription className="text-destructive/80">
            {errorTrip ? "We couldn't load the trip details. Please try again later." : "The trip you are looking for doesn't exist or you may not have access."}
          </CardDescription>
        </CardHeader>
        {errorTrip && <CardContent><p className="text-sm text-muted-foreground">Error: {errorTrip.message}</p></CardContent>}
      </Card>
    );
  }
  
  // Consolidate loading/error states for sub-collections for a cleaner message if needed,
  // but individual tab components can also show their own loaders/errors.

  return (
    <div className="space-y-8">
      <div className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-lg group">
        <Image 
          src={trip.coverPhotoURL || 'https://placehold.co/1200x400.png?text=Trip+Photo'} 
          alt={trip.name} 
          fill
          style={{ objectFit: 'cover' }}
          className="brightness-75 group-hover:brightness-90 transition-all duration-300"
          data-ai-hint={trip.dataAiHint || 'travel landscape'}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white">
          <h1 className="text-3xl md:text-5xl font-bold drop-shadow-md">{trip.name}</h1>
          <p className="text-lg md:text-xl text-gray-200 flex items-center mt-2 drop-shadow-sm">
            <MapPin className="mr-2 h-5 w-5 flex-shrink-0" /> {trip.destination}
          </p>
          <p className="text-sm text-gray-300 flex items-center mt-1 drop-shadow-sm">
            <CalendarDays className="mr-2 h-4 w-4 flex-shrink-0" /> {trip.startDate.toLocaleDateString()} - {trip.endDate.toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" className="absolute top-4 right-4 bg-background/80 hover:bg-background text-foreground shadow-md hover:shadow-lg transition-all">
            <Settings className="mr-2 h-4 w-4" /> Trip Settings
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-1 mb-6 shadow-sm bg-muted p-1 rounded-lg">
          <TabsTrigger value="overview" className="flex-1 py-2.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4 xs:mr-0 sm:mr-2" /> <span className="hidden xs:hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1 py-2.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4 xs:mr-0 sm:mr-2" /> <span className="hidden xs:hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 py-2.5 text-xs sm:text-sm">
            <Users className="h-4 w-4 xs:mr-0 sm:mr-2" /> <span className="hidden xs:hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="flex-1 py-2.5 text-xs sm:text-sm">
            <FileText className="h-4 w-4 xs:mr-0 sm:mr-2" /> <span className="hidden xs:hidden sm:inline">Itinerary</span>
          </TabsTrigger>
          <TabsTrigger value="packing" className="flex-1 py-2.5 text-xs sm:text-sm">
            <ListChecks className="h-4 w-4 xs:mr-0 sm:mr-2" /> <span className="hidden xs:hidden sm:inline">Packing List</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {isLoadingTrip ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : 
           errorTrip ? <p className="text-destructive">Error loading overview: {errorTrip.message}</p> :
           trip ? <TripOverviewTab trip={trip} expenses={expenses} currentUser={currentUser} /> : <p>No trip data.</p>}
        </TabsContent>
        <TabsContent value="expenses">
          {isLoadingExpenses ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorExpenses ? <p className="text-destructive">Error loading expenses: {errorExpenses.message}</p> :
           <ExpensesTab tripId={tripId} expenses={expenses} members={members} />}
        </TabsContent>
        <TabsContent value="members">
          {isLoadingMembers ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorMembers ? <p className="text-destructive">Error loading members: {errorMembers.message}</p> :
           <MembersTab tripId={tripId} members={members} />}
        </TabsContent>
        <TabsContent value="itinerary">
          {isLoadingItinerary ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorItinerary ? <p className="text-destructive">Error loading itinerary: {errorItinerary.message}</p> :
           <ItineraryTab tripId={tripId} itineraryEvents={itineraryEvents} />}
        </TabsContent>
        <TabsContent value="packing">
          {isLoadingPacking ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorPacking ? <p className="text-destructive">Error loading packing list: {errorPacking.message}</p> :
           <PackingListTab tripId={tripId} packingItems={packingItems} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

    