
'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, ListChecks, MapPin, PlusCircle, BarChart3, Sparkles, FileText, CalendarDays, Settings, Loader2, AlertTriangle, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp as FirestoreTimestamp, updateDoc, addDoc, where, writeBatch } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import React, { useState } from 'react';
import AddExpenseModal from '@/components/trips/add-expense-modal';
import InviteMemberModal from '@/components/trips/invite-member-modal'; // New
import AddEventModal from '@/components/trips/add-event-modal'; // New
import { Input } from '@/components/ui/input'; // New
import { suggestDebtSettlement, type SuggestDebtSettlementInput, type SuggestDebtSettlementOutput } from '@/ai/flows/suggest-debt-settlement';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


// --- Data Types ---
export interface Trip { // Exporting for use in other components if needed
  id: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  description: string;
  coverPhotoURL: string;
  dataAiHint: string;
  ownerId: string;
  members: string[]; 
  totalExpenses?: number;
  baseCurrency?: string; 
}

export interface Expense { 
  id: string;
  description: string;
  amount: number;
  currency: string; 
  paidBy: string; 
  paidByName?: string;
  date: Date;
  category: string; 
  participants: string[]; 
  splitType: 'equally' | 'unequally' | 'percentage'; 
  notes?: string; 
  createdAt?: FirestoreTimestamp; 
}

export interface ItineraryEvent { // Exporting
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: string;
  location?: string;
  notes?: string;
  endDate?: Date; // For multi-day events or accommodations
  attachments?: string[]; // URLs to attachments in Firebase Storage
}

export interface PackingListItem { // Exporting
  id: string;
  name: string;
  packed: boolean;
  assignee?: string;
  assigneeName?: string;
  addedBy?: string;
  lastCheckedBy?: string;
}

export interface Member { 
  id: string; 
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
      baseCurrency: data.baseCurrency || 'USD', 
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
    if (data.date && data.date instanceof FirestoreTimestamp) {
      data.date = data.date.toDate();
    }
    if (data.endDate && data.endDate instanceof FirestoreTimestamp) { // For ItineraryEvent
      data.endDate = data.endDate.toDate();
    }
    if (data.createdAt && data.createdAt instanceof FirestoreTimestamp) {
        data.createdAt = data.createdAt.toDate();
    }
    return { ...data, [idField]: docSnap.id } as T;
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
  return { id: userId, displayName: 'Unknown User (' + userId.substring(0,6) + '...)', photoURL: `https://placehold.co/40x40.png?text=U`, email: '' };
}


// --- Tab Components ---

function TripOverviewTab({ trip, expenses, currentUser }: { trip: Trip; expenses: Expense[] | undefined; currentUser: FirebaseUser | null}) {
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const yourSpending = expenses?.filter(exp => exp.paidBy === currentUser?.uid).reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const netBalance = 0; 

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trip Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
            <p className="text-2xl font-bold">{trip.baseCurrency} {totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Your Spending</h3>
            <p className="text-2xl font-bold">{trip.baseCurrency} {yourSpending.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Your Net Balance</h3>
            <p className={`text-2xl font-bold ${netBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {trip.baseCurrency} {netBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-xs text-muted-foreground">Use AI settlement for details</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{trip.description || "No description provided for this trip."}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpensesTab({ tripId, expenses, members, tripCurrency, onExpenseAction }: { 
  tripId: string; 
  expenses: Expense[] | undefined; 
  members: Member[] | undefined;
  tripCurrency: string;
  onExpenseAction: () => void; 
}) {
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementPlan, setSettlementPlan] = useState<SuggestDebtSettlementOutput['settlementPlan'] | null>(null);
  const [isSuggestingSettlement, setIsSuggestingSettlement] = useState(false);
  const { toast } = useToast();

  const getMemberName = (uid: string) => members?.find(m => m.id === uid)?.displayName || uid.substring(0,6)+"...";
  const getParticipantNames = (participantUIDs: string[]) => {
    if (!members || !participantUIDs) return 'N/A';
    return participantUIDs.map(uid => getMemberName(uid)).join(', ') || 'All involved';
  };

  const handleSuggestSettlement = async () => {
    if (!expenses || expenses.length === 0 || !members || members.length === 0) {
      toast({
        title: "No Data for Settlement",
        description: "Please add some expenses and members before suggesting a settlement.",
        variant: "destructive",
      });
      return;
    }
    setIsSuggestingSettlement(true);
    try {
      const genkitInput: SuggestDebtSettlementInput = {
        expenses: expenses.map(e => ({
          payer: e.paidBy,
          amount: e.amount,
          currency: e.currency, 
          participants: e.participants,
        })),
        members: members.map(m => m.id),
      };
      const result = await suggestDebtSettlement(genkitInput);
      setSettlementPlan(result.settlementPlan);
      setIsSettlementModalOpen(true);
    } catch (error: any) {
      console.error("Error suggesting debt settlement:", error);
      toast({
        title: "AI Settlement Error",
        description: error.message || "Could not generate settlement suggestions.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingSettlement(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Expenses</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setIsAddExpenseModalOpen(true)} 
            className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleSuggestSettlement}
            disabled={isSuggestingSettlement || !expenses || expenses.length === 0}
            className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
          >
            {isSuggestingSettlement ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Suggest Debt Settlement (AI)
          </Button>
        </div>
      </div>

      {isAddExpenseModalOpen && members && (
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
          tripId={tripId}
          members={members}
          tripCurrency={tripCurrency}
          onExpenseAdded={() => {
            onExpenseAction(); 
            setIsAddExpenseModalOpen(false);
          }}
        />
      )}
      
      {settlementPlan && (
        <AlertDialog open={isSettlementModalOpen} onOpenChange={setIsSettlementModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suggested Debt Settlement</AlertDialogTitle>
              <AlertDialogDescription>
                Here&apos;s an optimized plan to settle debts:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 space-y-2">
              {settlementPlan.length > 0 ? settlementPlan.map((item, index) => (
                <div key={index} className="p-3 bg-muted rounded-md text-sm">
                  <strong>{getMemberName(item.from)}</strong> owes <strong>{getMemberName(item.to)}</strong>: {item.currency} {item.amount.toFixed(2)}
                </div>
              )) : <p>No settlements needed or unable to determine.</p>}
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsSettlementModalOpen(false)}>Got it!</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {expenses && expenses.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {expenses.map(exp => (
                <li key={exp.id} className="p-4 hover:bg-muted/50 group">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                    <div className="flex-grow">
                      <p className="font-medium">{exp.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid by {getMemberName(exp.paidBy)} on {exp.date.toLocaleDateString()} - {exp.currency} {exp.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-1">Category: {exp.category}</p>
                      {exp.participants && exp.participants.length > 0 && (
                        <p className="text-xs text-muted-foreground/80 mt-1">
                          Participants: {getParticipantNames(exp.participants)}
                        </p>
                      )}
                       {exp.notes && <p className="text-xs text-muted-foreground/80 mt-1">Notes: {exp.notes}</p>}
                    </div>
                    {/* Edit/Delete Buttons - Future implementation */}
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
    </div>
  );
}

function MembersTab({ trip, members, onMemberAction }: { 
  trip: Trip; 
  members: Member[] | undefined;
  onMemberAction: () => void;
}) {
  const { user: currentUser } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const isTripOwner = currentUser?.uid === trip.ownerId;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Trip Members ({members?.length || 0})</h2>
        {isTripOwner && (
          <Button 
            variant="outline" 
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="mr-2 h-4 w-4" /> Invite Member
          </Button>
        )}
      </div>

      {isInviteModalOpen && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          tripId={trip.id}
          currentMembers={trip.members}
          onMemberInvited={onMemberAction}
        />
      )}

      {members && members.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {members.map(member => (
                <li key={member.id} className="p-4 flex items-center space-x-3 hover:bg-muted/50">
                  <Image 
                    src={member.photoURL || `https://placehold.co/40x40.png?text=${member.displayName?.[0]?.toUpperCase() || 'M'}`} 
                    alt={member.displayName || 'Member'} 
                    width={40} height={40} 
                    className="rounded-full" 
                    data-ai-hint="person avatar"
                  />
                  <div>
                    <p className="font-medium">{member.displayName || member.id.substring(0, 10) + "..."}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.id === currentUser?.uid ? 'You' : ''}
                      {member.id === trip.ownerId ? (member.id === currentUser?.uid ? ' (Owner)' : 'Owner') : 'Member'}
                    </p>
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

function ItineraryTab({ tripId, itineraryEvents, onEventAction }: { 
  tripId: string; 
  itineraryEvents: ItineraryEvent[] | undefined;
  onEventAction: () => void;
}) {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Itinerary</h2>
        <Button 
          onClick={() => setIsAddEventModalOpen(true)}
          className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>

      {isAddEventModalOpen && (
        <AddEventModal
          isOpen={isAddEventModalOpen}
          onClose={() => setIsAddEventModalOpen(false)}
          tripId={tripId}
          onEventAdded={() => {
            onEventAction();
            setIsAddEventModalOpen(false);
          }}
        />
      )}

      {itineraryEvents && itineraryEvents.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {itineraryEvents.map(event => (
                <li key={event.id} className="p-4 hover:bg-muted/50">
                  <p className="font-medium">{event.title} <Badge variant="outline" className="ml-2">{event.type}</Badge></p>
                  <p className="text-sm text-muted-foreground">
                    {event.date.toLocaleDateString()} {event.time ? `- ${event.time}` : ''}
                    {event.endDate && event.endDate > event.date ? ` to ${event.endDate.toLocaleDateString()}` : ''}
                  </p>
                  {event.location && <p className="text-xs text-muted-foreground/80 mt-1">Location: {event.location}</p>}
                  {event.notes && <p className="text-xs text-muted-foreground/80 mt-1 whitespace-pre-wrap">Notes: {event.notes}</p>}
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

function PackingListTab({ tripId, packingItems, onPackingAction, currentUser }: { 
  tripId: string; 
  packingItems: PackingListItem[] | undefined;
  onPackingAction: () => void;
  currentUser: FirebaseUser | null;
}) {
  const [newItemName, setNewItemName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const totalItems = packingItems?.length || 0;
  const packedItemsCount = packingItems?.filter(item => item.packed).length || 0;
  const progress = totalItems > 0 ? (packedItemsCount / totalItems) * 100 : 0;

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast({ title: "Item name cannot be empty", variant: "destructive" });
      return;
    }
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    setIsAddingItem(true);
    try {
      await addDoc(collection(db, 'trips', tripId, 'packingItems'), {
        name: newItemName.trim(),
        packed: false,
        addedBy: currentUser.uid,
        createdAt: FirestoreTimestamp.now(),
      });
      setNewItemName('');
      onPackingAction(); // Refetch
      toast({ title: "Item Added", description: `"${newItemName.trim()}" added to the packing list.` });
    } catch (error: any) {
      toast({ title: "Error Adding Item", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleTogglePacked = async (item: PackingListItem) => {
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    const itemRef = doc(db, 'trips', tripId, 'packingItems', item.id);
    try {
      await updateDoc(itemRef, { 
        packed: !item.packed,
        lastCheckedBy: currentUser.uid,
      });
      // Optimistic update in React Query cache
      queryClient.setQueryData<PackingListItem[]>(['tripPackingList', tripId], (oldData) =>
        oldData?.map(oldItem => oldItem.id === item.id ? { ...oldItem, packed: !oldItem.packed, lastCheckedBy: currentUser.uid } : oldItem)
      );
      // No need to call onPackingAction() here as setQueryData handles local state
    } catch (error: any) {
      toast({ title: "Error Updating Item", description: error.message, variant: "destructive" });
    }
  };

 return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Packing List ({packedItemsCount}/{totalItems} packed)</h2>
      </div>
      <Card className="shadow-sm">
        <CardContent className="pt-6"> 
          <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="flex gap-2 mb-4">
            <Input 
              placeholder="Add new packing item..." 
              value={newItemName} 
              onChange={(e) => setNewItemName(e.target.value)}
              disabled={isAddingItem}
            />
            <Button type="submit" disabled={isAddingItem || !newItemName.trim()}>
              {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              <span className="hidden sm:inline ml-2">Add</span>
            </Button>
          </form>

          {totalItems > 0 && (
            <div className="w-full bg-muted rounded-full h-2.5 mb-4 shadow-inner">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {packingItems && packingItems.length > 0 ? (
            <ul className="divide-y max-h-96 overflow-y-auto">
              {packingItems.map(item => (
                <li key={item.id} className="py-3 flex justify-between items-center hover:bg-muted/50 px-1 group">
                  <label htmlFor={`item-${item.id}`} className="flex items-center cursor-pointer flex-grow">
                    <Checkbox 
                      id={`item-${item.id}`}
                      checked={item.packed} 
                      onCheckedChange={() => handleTogglePacked(item)}
                      className="mr-3"
                    />
                    <span className={`${item.packed ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>
                  </label>
                  {/* Future: Assignee, Delete button */}
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
  const queryClient = useQueryClient();


  const { data: trip, isLoading: isLoadingTrip, error: errorTrip, refetch: refetchTripDetails } = useQuery<Trip | null, Error>({
    queryKey: ['tripDetails', tripId],
    queryFn: () => fetchTripDetails(tripId),
    enabled: !!tripId,
  });

  const { data: expenses, isLoading: isLoadingExpenses, error: errorExpenses } = useQuery<Expense[], Error>({
    queryKey: ['tripExpenses', tripId],
    queryFn: () => fetchSubCollection<Expense>(tripId, 'expenses', 'id', 'date', 'desc'), 
    enabled: !!tripId,
  });
  
  const { data: itineraryEvents, isLoading: isLoadingItinerary, error: errorItinerary } = useQuery<ItineraryEvent[], Error>({
    queryKey: ['tripItinerary', tripId],
    queryFn: () => fetchSubCollection<ItineraryEvent>(tripId, 'itineraryEvents', 'id', 'date', 'asc'),
    enabled: !!tripId,
  });

  const { data: packingItems, isLoading: isLoadingPacking, error: errorPacking } = useQuery<PackingListItem[], Error>({
    queryKey: ['tripPackingList', tripId],
    queryFn: () => fetchSubCollection<PackingListItem>(tripId, 'packingItems', 'id', 'createdAt', 'asc'), // Order by createdAt
    enabled: !!tripId,
  });

  const memberUIDs = trip?.members || [];
  const memberQueries = useQueries({
    queries: memberUIDs.map(uid => ({
      queryKey: ['memberDetails', uid],
      queryFn: () => fetchMemberDetails(uid),
      enabled: !!uid,
      staleTime: 5 * 60 * 1000, 
    })),
  });

  const members = memberQueries.every(q => q.isSuccess) 
                ? memberQueries.map(q => q.data).filter(Boolean) as Member[] 
                : undefined;
  const isLoadingMembers = memberQueries.some(q => q.isLoading);
  const errorMembers = memberQueries.find(q => q.error)?.error;

  const handleGenericAction = (queryKey: string | string[]) => {
    const key = Array.isArray(queryKey) ? queryKey : [queryKey, tripId];
    queryClient.invalidateQueries({ queryKey: key });
    if (queryKey === 'tripDetails' || (Array.isArray(queryKey) && queryKey[0] === 'tripDetails')) {
        refetchTripDetails(); // Specifically refetch trip details for member changes
        queryClient.invalidateQueries({ queryKey: ['memberDetails'] }); // Invalidate all member details
    }
  };


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
          {isLoadingExpenses || isLoadingMembers ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorExpenses ? <p className="text-destructive">Error loading expenses: {errorExpenses.message}</p> :
           trip && <ExpensesTab 
              tripId={tripId} 
              expenses={expenses} 
              members={members} 
              tripCurrency={trip.baseCurrency || 'USD'}
              onExpenseAction={() => handleGenericAction('tripExpenses')}
            />}
        </TabsContent>
        <TabsContent value="members">
          {isLoadingMembers || isLoadingTrip ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorMembers || errorTrip ? <p className="text-destructive">Error loading members: {(errorMembers || errorTrip)?.message}</p> :
           trip && <MembersTab trip={trip} members={members} onMemberAction={() => handleGenericAction('tripDetails')} />}
        </TabsContent>
        <TabsContent value="itinerary">
          {isLoadingItinerary ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorItinerary ? <p className="text-destructive">Error loading itinerary: {errorItinerary.message}</p> :
           <ItineraryTab tripId={tripId} itineraryEvents={itineraryEvents} onEventAction={() => handleGenericAction('tripItinerary')} />}
        </TabsContent>
        <TabsContent value="packing">
          {isLoadingPacking ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorPacking ? <p className="text-destructive">Error loading packing list: {errorPacking.message}</p> :
           <PackingListTab tripId={tripId} packingItems={packingItems} onPackingAction={() => handleGenericAction('tripPackingList')} currentUser={currentUser} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
