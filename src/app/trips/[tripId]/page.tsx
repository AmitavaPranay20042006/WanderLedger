
'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, ListChecks, MapPin, BarChart3, FileText, CalendarDays, Scale, Loader2, AlertTriangle, IndianRupee, Edit3 } from 'lucide-react';
import Image from 'next/image';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import React, { useCallback, useEffect } from 'react';

import type { Trip, Expense, ItineraryEvent, PackingListItem, Member, RecordedPayment } from '@/lib/types/trip';

import TripOverviewTab from '@/components/trips/details/trip-overview-tab';
import ExpensesTab from '@/components/trips/details/expenses-tab';
import SettlementTab from '@/components/trips/details/settlement-tab';
import MembersTab from '@/components/trips/details/members-tab';
import ItineraryTab from '@/components/trips/details/itinerary-tab';
import PackingListTab from '@/components/trips/details/packing-list-tab';

async function fetchTripDetails(tripId: string): Promise<Trip | null> {
  if (!tripId) return null;
  const tripRef = doc(db, 'trips', tripId);
  const tripSnap = await getDoc(tripRef);

  if (tripSnap.exists()) {
    const data = tripSnap.data();
    const processedData = { ...data } as { [key: string]: any };
    Object.keys(processedData).forEach(key => {
      if (processedData[key] instanceof FirestoreTimestamp) {
        processedData[key] = (processedData[key] as FirestoreTimestamp).toDate();
      }
    });

    return {
      id: tripSnap.id,
      ...processedData,
      baseCurrency: data.baseCurrency || 'INR',
      coverPhotoURL: data.coverPhotoURL || `https://placehold.co/1200x480.png?text=${encodeURIComponent(data.name || 'Trip')}`
    } as Trip;
  }
  return null;
}

async function fetchSubCollection<T>(tripId: string, subCollectionName: string, idField: string = 'id', orderByField?: string, orderByDirection: 'asc' | 'desc' = 'desc'): Promise<T[]> {
  if (!tripId) return [];
  const subCollectionRef = collection(db, 'trips', tripId, subCollectionName);
  let q;
  if (orderByField) {
    q = query(subCollectionRef, orderBy(orderByField, orderByDirection));
  } else {
    q = query(subCollectionRef);
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    const processedData = { ...data } as { [key: string]: any };
    Object.keys(processedData).forEach(key => {
      if (processedData[key] instanceof FirestoreTimestamp) {
        if (key === 'date' || key === 'startDate' || key === 'endDate' || key === 'createdAt' || key === 'dateRecorded') {
             processedData[key] = (processedData[key] as FirestoreTimestamp).toDate();
        }
      }
    });
    return { ...processedData, [idField]: docSnap.id } as T;
  });
}

async function fetchMemberDetails(userId: string): Promise<Member | null> {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      displayName: data.displayName || 'Unknown User',
      photoURL: data.photoURL || `https://placehold.co/40x40.png?text=${data.displayName?.[0]?.toUpperCase() || 'U'}`,
      email: data.email || '',
    } as Member;
  }
  return { id: userId, displayName: 'Unknown User (' + userId.substring(0, 6) + '...)', photoURL: `https://placehold.co/40x40.png?text=U`, email: '' };
}

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('TripDetailPage currentUser.uid:', currentUser?.uid);
  }, [currentUser]);

  const { data: trip, isLoading: isLoadingTrip, error: errorTrip, refetch: refetchTripDetails } = useQuery<Trip | null, Error>({
    queryKey: ['tripDetails', tripId],
    queryFn: () => fetchTripDetails(tripId),
    enabled: !!tripId,
  });

  const { data: expenses, isLoading: isLoadingExpenses, error: errorExpenses, refetch: refetchExpenses } = useQuery<Expense[], Error>({
    queryKey: ['tripExpenses', tripId],
    queryFn: () => fetchSubCollection<Expense>(tripId, 'expenses', 'id', 'date', 'desc'),
    enabled: !!tripId,
  });

  const { data: recordedPayments, isLoading: isLoadingRecordedPayments, error: errorRecordedPayments, refetch: refetchRecordedPayments } = useQuery<RecordedPayment[], Error>({
    queryKey: ['recordedPayments', tripId],
    queryFn: () => fetchSubCollection<RecordedPayment>(tripId, 'recordedPayments', 'id', 'dateRecorded', 'desc'),
    enabled: !!tripId && !!currentUser,
  });

  const { data: itineraryEvents, isLoading: isLoadingItinerary, error: errorItinerary, refetch: refetchItinerary } = useQuery<ItineraryEvent[], Error>({
    queryKey: ['tripItinerary', tripId],
    queryFn: () => fetchSubCollection<ItineraryEvent>(tripId, 'itineraryEvents', 'id', 'date', 'asc'),
    enabled: !!tripId,
  });

  const { data: packingItems, isLoading: isLoadingPacking, error: errorPacking, refetch: refetchPackingList } = useQuery<PackingListItem[], Error>({
    queryKey: ['tripPackingList', tripId],
    queryFn: () => fetchSubCollection<PackingListItem>(tripId, 'packingItems', 'id', 'createdAt', 'asc'),
    enabled: !!tripId,
  });

  const memberUIDs = trip?.members || [];
  const memberQueries = useQueries({
    queries: memberUIDs.map(uid => ({
      queryKey: ['memberDetails', uid],
      queryFn: () => fetchMemberDetails(uid),
      enabled: !!uid,
      staleTime: 15 * 60 * 1000,
    })),
  });

  const members = memberQueries.every(q => q.isSuccess)
    ? memberQueries.map(q => q.data).filter(Boolean) as Member[]
    : undefined;
  const isLoadingMembers = memberQueries.some(q => q.isLoading);
  const errorMembers = memberQueries.find(q => q.error)?.error;


  const handleGenericAction = useCallback((queryKeysToInvalidate: string[]) => {
    queryKeysToInvalidate.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key, tripId] });
    });
    if (queryKeysToInvalidate.includes('tripDetails')) {
      refetchTripDetails().then(() => {
        queryClient.invalidateQueries({ queryKey: ['memberDetails'] });
      });
    }
    if (queryKeysToInvalidate.includes('recordedPayments')) {
      refetchRecordedPayments();
    }
    if (queryKeysToInvalidate.includes('tripExpenses')) {
      refetchExpenses();
    }
  }, [queryClient, tripId, refetchTripDetails, refetchRecordedPayments, refetchExpenses]);


  if (isLoadingTrip || isLoadingMembers || isLoadingRecordedPayments) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)]">
        <Loader2 className="h-20 w-20 animate-spin text-primary mb-6" />
        <p className="text-muted-foreground text-xl">Loading trip details...</p>
      </div>
    );
  }

  if (errorTrip || !trip) {
    return (
      <Card className="text-center py-16 shadow-xl border-destructive bg-destructive/5 my-8">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-3xl text-destructive">
            {errorTrip ? "Error Loading Trip" : "Trip Not Found"}
          </CardTitle>
          <CardDescription className="text-destructive/80 text-lg mt-2">
            {errorTrip ? "We couldn't load the trip details. Please try again later." : "The trip you are looking for doesn't exist or you may not have access."}
          </CardDescription>
        </CardHeader>
        {errorTrip && <CardContent><p className="text-base text-muted-foreground">Error: {errorTrip.message}</p></CardContent>}
        {errorRecordedPayments && <CardContent><p className="text-base text-muted-foreground">Error loading payments: {errorRecordedPayments.message}</p></CardContent>}
      </Card>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10 pb-12">
      <div className="relative h-64 md:h-96 rounded-xl overflow-hidden shadow-2xl group">
        <Image
          src={trip.coverPhotoURL}
          alt={trip.name}
          fill
          style={{ objectFit: 'cover' }}
          className="transition-transform duration-500 group-hover:scale-105"
          data-ai-hint={trip.dataAiHint || 'travel landscape'}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white">
          <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">{trip.name}</h1>
          <p className="text-lg md:text-xl text-gray-200 flex items-center mt-2 md:mt-3 drop-shadow-md">
            <MapPin className="mr-2.5 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" /> {trip.destination}
          </p>
          <p className="text-sm md:text-base text-gray-300 flex items-center mt-1.5 drop-shadow-md">
            <CalendarDays className="mr-2.5 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" /> {trip.startDate instanceof Date ? trip.startDate.toLocaleDateString() : ''} - {trip.endDate instanceof Date ? trip.endDate.toLocaleDateString() : ''}
          </p>
        </div>
        {/* Optional: Edit Trip Button for Owner */}
        {/* {currentUser?.uid === trip.ownerId && (
          <Button variant="outline" size="icon" className="absolute top-4 right-4 bg-background/80 hover:bg-background text-foreground shadow-lg">
            <Edit3 className="h-5 w-5" />
          </Button>
        )} */}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-1.5 mb-8 shadow-md bg-muted p-1.5 rounded-lg h-auto sticky top-20 z-40 backdrop-blur-sm bg-background/80"> {/* Added sticky and backdrop for better scroll */}
          {[
            {value: "overview", label: "Overview", icon: BarChart3},
            {value: "expenses", label: "Expenses", icon: DollarSign},
            {value: "settlement", label: "Settlement", icon: Scale},
            {value: "members", label: "Members", icon: Users},
            {value: "itinerary", label: "Itinerary", icon: FileText},
            {value: "packing", label: "Packing", icon: ListChecks},
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-150 ease-in-out">
              <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" /> <span className="hidden xs:hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          {isLoadingTrip || isLoadingExpenses || isLoadingMembers ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mt-10" /> :
            errorTrip ? <p className="text-destructive text-center mt-10">Error loading overview: {errorTrip.message}</p> :
              trip ? <TripOverviewTab trip={trip} expenses={expenses} members={members} currentUser={currentUser} /> : <p className="text-center mt-10">No trip data available for overview.</p>}
        </TabsContent>
        <TabsContent value="expenses">
          {isLoadingExpenses || isLoadingMembers || isLoadingTrip ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mt-10" /> :
            errorExpenses ? <p className="text-destructive text-center mt-10">Error loading expenses: {errorExpenses.message}</p> :
              trip && <ExpensesTab
                trip={trip}
                expenses={expenses}
                members={members}
                tripCurrency={trip.baseCurrency || 'INR'}
                onExpenseAction={() => handleGenericAction(['tripExpenses', 'recordedPayments'])}
                currentUser={currentUser}
              />}
        </TabsContent>
        <TabsContent value="settlement">
          {isLoadingExpenses || isLoadingMembers || isLoadingTrip || isLoadingRecordedPayments ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mt-10" /> :
            (errorExpenses || errorRecordedPayments || errorMembers) ? (
                 <Card className="text-center py-10 shadow-lg border-destructive bg-destructive/5">
                    <CardHeader>
                        <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl text-destructive">Data Loading Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive/90 text-base">
                            {errorExpenses ? `Failed to load expenses: ${errorExpenses.message}; ` : ''}
                            {errorRecordedPayments ? `Failed to load recorded payments: ${errorRecordedPayments.message}; ` : ''}
                            {errorMembers && !errorExpenses && !errorRecordedPayments ? `Failed to load member details: ${errorMembers.message}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground mt-3">
                            This usually indicates a permission issue. Ensure the logged-in user is a member of this trip and that Firestore rules allow access to subcollections.
                        </p>
                         <Button variant="outline" size="lg" className="mt-6" onClick={() => {
                            if (errorExpenses) refetchExpenses();
                            if (errorRecordedPayments) refetchRecordedPayments();
                            if (errorMembers) queryClient.invalidateQueries({queryKey: ['memberDetails']});
                         }}>
                            Try Reloading Data
                         </Button>
                    </CardContent>
                </Card>
            ) :
              trip && members ? <SettlementTab trip={trip} expenses={expenses} members={members} recordedPayments={recordedPayments} currentUser={currentUser} onAction={() => handleGenericAction(['recordedPayments', 'tripExpenses'])} /> : <p className="text-center mt-10">Loading data or insufficient data for settlement.</p>}
        </TabsContent>
        <TabsContent value="members">
          {isLoadingMembers || isLoadingTrip ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mt-10" /> :
            errorMembers || errorTrip ? <p className="text-destructive text-center mt-10">Error loading members: {(errorMembers || errorTrip)?.message}</p> :
              trip && <MembersTab trip={trip} fetchedMembers={members} onMemberAction={() => handleGenericAction(['tripDetails'])} />}
        </TabsContent>
        <TabsContent value="itinerary">
          {isLoadingItinerary || isLoadingTrip ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mt-10" /> :
            errorItinerary ? <p className="text-destructive text-center mt-10">Error loading itinerary: {errorItinerary.message}</p> :
              <ItineraryTab tripId={tripId} itineraryEvents={itineraryEvents} onEventAction={() => handleGenericAction(['tripItinerary'])} tripStartDate={trip?.startDate} tripEndDate={trip?.endDate}/>}
        </TabsContent>
        <TabsContent value="packing">
          {isLoadingPacking || isLoadingTrip ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mt-10" /> :
            errorPacking ? <p className="text-destructive text-center mt-10">Error loading packing list: {errorPacking.message}</p> :
              <PackingListTab tripId={tripId} initialPackingItems={packingItems} onPackingAction={() => handleGenericAction(['tripPackingList'])} currentUser={currentUser} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
