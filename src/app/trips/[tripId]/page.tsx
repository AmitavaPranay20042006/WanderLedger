
'use client';

import { useParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, ListChecks, MapPin, PlusCircle, BarChart3, Sparkles, FileText, CalendarDays, Settings, Loader2, AlertTriangle, Edit, Trash2, CheckSquare, Square, IndianRupee, UserPlus, MapPinIcon, UserMinus } from 'lucide-react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp as FirestoreTimestamp, updateDoc, addDoc, where, writeBatch, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import React, { useState, useEffect, useCallback } from 'react';
import AddExpenseModal from '@/components/trips/add-expense-modal';
import InviteMemberModal from '@/components/trips/invite-member-modal';
import AddEventModal from '@/components/trips/add-event-modal';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from '@/components/ui/progress';


// --- Data Types ---
export interface Trip {
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
  createdAt?: Date;
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
  createdAt?: Date;
}

export interface ItineraryEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: string;
  location?: string;
  notes?: string;
  endDate?: Date;
  attachments?: string[];
  createdAt?: Date;
}

export interface PackingListItem {
  id: string;
  name: string;
  packed: boolean;
  assignee?: string;
  assigneeName?: string;
  addedBy?: string;
  lastCheckedBy?: string;
  createdAt?: Date;
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
        processedData[key] = (processedData[key] as FirestoreTimestamp).toDate();
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
  return { id: userId, displayName: 'Unknown User (' + userId.substring(0,6) + '...)', photoURL: `https://placehold.co/40x40.png?text=U`, email: '' };
}


// --- Tab Components ---

function TripOverviewTab({ trip, expenses, currentUser }: { trip: Trip; expenses: Expense[] | undefined; currentUser: FirebaseUser | null}) {
  const displayCurrencySymbol = trip.baseCurrency === 'INR' ? '₹' : trip.baseCurrency;
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const yourSpending = expenses?.filter(exp => exp.paidBy === currentUser?.uid).reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const netBalance = 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Trip Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
            <p className="text-2xl font-bold">{displayCurrencySymbol}{totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Your Spending (Paid by You)</h3>
            <p className="text-2xl font-bold">{displayCurrencySymbol}{yourSpending.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Your Net Balance</h3>
            <p className={`text-2xl font-bold ${netBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {displayCurrencySymbol}{netBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-xs text-muted-foreground">AI settlement needed for details</p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-md">
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
  const displayCurrencySymbol = tripCurrency === 'INR' ? '₹' : tripCurrency;

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
            variant="outline"
            onClick={handleSuggestSettlement}
            disabled={isSuggestingSettlement || !expenses || expenses.length === 0}
            className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
          >
            {isSuggestingSettlement ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Suggest Settlement (AI)
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
                Here&apos;s an optimized plan to settle debts based on the expenses recorded:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 space-y-2 text-sm">
              {settlementPlan.length > 0 ? settlementPlan.map((item, index) => (
                <div key={index} className="p-3 bg-muted rounded-md">
                  <strong>{getMemberName(item.from)}</strong> owes <strong>{getMemberName(item.to)}</strong>: <span className="font-semibold">{item.currency === 'INR' ? '₹' : item.currency} {item.amount.toFixed(2)}</span>
                </div>
              )) : <p className="text-muted-foreground">No settlements needed or AI could not determine a plan with the current data.</p>}
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
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div className="flex-grow">
                      <p className="font-semibold text-base">{exp.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid by {getMemberName(exp.paidBy)} on {exp.date.toLocaleDateString()}
                      </p>
                      <div className="text-lg font-medium mt-1 flex items-center">
                        <span>{exp.currency === 'INR' ? '₹' : exp.currency} {exp.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{exp.category}</Badge>
                      </div>
                      {exp.participants && exp.participants.length > 0 && (
                        <p className="text-xs text-muted-foreground/80 mt-1">
                          Participants: {getParticipantNames(exp.participants)}
                        </p>
                      )}
                       {exp.notes && <p className="text-xs text-muted-foreground/80 mt-1">Notes: {exp.notes}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-10 shadow-sm border-dashed">
            <CardContent>
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-semibold">No expenses recorded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Start by adding the first shared cost!</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

function MembersTab({ trip, members: fetchedMembers, onMemberAction }: {
  trip: Trip;
  members: Member[] | undefined;
  onMemberAction: () => void;
}) {
  const { user: currentUser } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const { toast } = useToast();
  const isTripOwner = currentUser?.uid === trip.ownerId;

  const handleRemoveMember = async () => {
    if (!memberToRemove || !isTripOwner || !currentUser) return;
    if (memberToRemove.id === currentUser.uid) {
        toast({ title: "Cannot Remove Self", description: "You cannot remove yourself as the trip owner.", variant: "destructive" });
        setMemberToRemove(null);
        return;
    }
    if (trip.members.length <= 1) {
        toast({ title: "Cannot Remove Last Member", description: "A trip must have at least one member.", variant: "destructive" });
        setMemberToRemove(null);
        return;
    }

    try {
      const tripRef = doc(db, 'trips', trip.id);
      await updateDoc(tripRef, {
        members: arrayRemove(memberToRemove.id)
      });
      toast({ title: "Member Removed", description: `${memberToRemove.displayName || 'Member'} has been removed from the trip.` });
      onMemberAction();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({ title: "Error Removing Member", description: error.message || "Could not remove member.", variant: "destructive" });
    } finally {
      setMemberToRemove(null);
    }
  };


  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Trip Members ({fetchedMembers?.length || 0})</h2>
        {isTripOwner && (
          <Button
            variant="outline"
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
            <UserPlus className="mr-2 h-4 w-4" /> Invite Member
          </Button>
        )}
      </div>

      {isInviteModalOpen && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          tripId={trip.id}
          currentMembers={trip.members}
          onMemberInvited={() => {
            onMemberAction();
            setIsInviteModalOpen(false);
          }}
        />
      )}

      {memberToRemove && (
        <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove {memberToRemove.displayName || 'Member'}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove {memberToRemove.displayName || 'this member'} from the trip? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setMemberToRemove(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRemoveMember}
                        className={buttonVariants({ variant: "destructive" })}
                    >
                        Remove Member
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}


      {fetchedMembers && fetchedMembers.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {fetchedMembers.map(member => (
                <li key={member.id} className="p-4 flex items-center justify-between space-x-4 hover:bg-muted/50 group">
                  <div className="flex items-center space-x-4">
                    <Image
                      src={member.photoURL || `https://placehold.co/40x40.png?text=${member.displayName?.[0]?.toUpperCase() || 'M'}`}
                      alt={member.displayName || 'Member avatar'}
                      width={40} height={40}
                      className="rounded-full"
                      data-ai-hint="person avatar"
                    />
                    <div>
                      <p className="font-medium">{member.displayName || member.id.substring(0, 10) + "..."}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.id === currentUser?.uid && 'You'}
                        {member.id === trip.ownerId ? (member.id === currentUser?.uid ? ' (Owner)' : ' (Owner)') : ''}
                      </p>
                    </div>
                  </div>
                  {isTripOwner && member.id !== currentUser?.uid && (
                     <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive group-hover:opacity-100 sm:opacity-0 transition-opacity"
                        onClick={() => setMemberToRemove(member)}
                        aria-label={`Remove ${member.displayName || 'member'}`}
                    >
                        <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-10 shadow-sm border-dashed">
            <CardContent>
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-semibold">No members found.</p>
                {isTripOwner && <p className="text-sm text-muted-foreground mt-1">Invite members to start collaborating!</p>}
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
  const [cnFunction, setCnFunction] = useState<((...inputs: any[]) => string) | null>(null);


  useEffect(() => {
    import('@/lib/utils').then(utils => {
      setCnFunction(() => utils.cn);
    });
  }, []);


  const groupedEvents = itineraryEvents?.reduce((acc, event) => {
    const dateStr = event.date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, ItineraryEvent[]>);


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

      {groupedEvents && Object.keys(groupedEvents).length > 0 && cnFunction ? (
        Object.entries(groupedEvents).map(([dateStr, eventsOnDate]) => (
          <Card key={dateStr} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{dateStr}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {eventsOnDate.sort((a,b) => (a.time || "00:00").localeCompare(b.time || "00:00")).map(event => (
                  <li key={event.id} className="p-4 hover:bg-muted/50">
                     <div className="flex items-start gap-3">
                        {event.time && <p className="text-sm font-medium text-primary w-16 pt-0.5">{event.time}</p>}
                        <div className={cnFunction("flex-grow", event.time ? "border-l pl-3" : "")}>
                            <div className="font-semibold flex items-center">
                                <span>{event.title}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">{event.type}</Badge>
                            </div>
                            {event.location && <p className="text-xs text-muted-foreground mt-1 flex items-center"><MapPinIcon className="h-3 w-3 mr-1.5"/> {event.location}</p>}
                            {event.notes && <p className="text-sm text-muted-foreground/90 mt-1 whitespace-pre-wrap">{event.notes}</p>}
                            {event.endDate && event.endDate.getTime() > event.date.getTime() &&
                             !event.time &&
                                <p className="text-xs text-muted-foreground/70 mt-0.5">Until: {event.endDate.toLocaleDateString()}</p>
                            }
                        </div>
                     </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      ) : (
         <Card className="text-center py-10 shadow-sm border-dashed">
            <CardContent>
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-semibold">Itinerary is empty.</p>
                <p className="text-sm text-muted-foreground mt-1">Add flights, accommodations, or activities!</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

function PackingListTab({ tripId, packingItems: initialPackingItems, onPackingAction, currentUser }: {
  tripId: string;
  packingItems: PackingListItem[] | undefined;
  onPackingAction: () => void;
  currentUser: FirebaseUser | null;
}) {
  // const [newItemName, setNewItemName] = useState('');
  // const [isAddingItem, setIsAddingItem] = useState(false);
  // const { toast } = useToast();

  // const packingItems = initialPackingItems || [];
  // const totalItems = packingItems.length;
  // const packedItemsCount = packingItems.filter(item => item.packed).length;
  // const progress = totalItems > 0 ? (packedItemsCount / totalItems) * 100 : 0;

  // const handleAddItem = async () => {
  //   if (!newItemName.trim()) {
  //     toast({ title: "Item name cannot be empty", variant: "destructive", description: "Please enter a name for the packing item." });
  //     return;
  //   }
  //   if (!currentUser) {
  //       toast({ title: "Authentication Error", description: "You must be logged in to add items.", variant: "destructive" });
  //       return;
  //   }
  //   setIsAddingItem(true);
  //   try {
  //     const itemToAdd = {
  //       name: newItemName.trim(),
  //       packed: false,
  //       addedBy: currentUser.uid,
  //       createdAt: FirestoreTimestamp.now(),
  //     };
  //     await addDoc(collection(db, 'trips', tripId, 'packingItems'), itemToAdd);

  //     toast({ title: "Item Added", description: `"${itemToAdd.name}" has been added to your packing list.` });
  //     setNewItemName('');
  //     onPackingAction();
  //   } catch (error: any) {
  //     console.error("Error adding packing item:", error);
  //     toast({
  //       title: "Error Adding Item",
  //       description: error.message || "An unexpected error occurred. Please try again.",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setIsAddingItem(false);
  //   }
  // };

  // const handleTogglePacked = async (item: PackingListItem) => {
  //   if (!currentUser) {
  //       toast({ title: "Authentication Error", description: "You must be logged in to update items.", variant: "destructive" });
  //       return;
  //   }
  //   const itemRef = doc(db, 'trips', tripId, 'packingItems', item.id);
  //   try {
  //     await updateDoc(itemRef, {
  //       packed: !item.packed,
  //       lastCheckedBy: currentUser.uid,
  //     });
  //     onPackingAction();
  //   } catch (error: any) {
  //     console.error("Error updating packing item:", error);
  //     toast({
  //       title: "Error Updating Item",
  //       description: error.message || "Could not update item status.",
  //       variant: "destructive"
  //     });
  //   }
  // };
  // Semicolons added for clarity
  const [newItemName, setNewItemName] = useState<string>('');
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const { toast } = useToast();

  const packingItems = initialPackingItems || [];
  const totalItems: number = packingItems.length;
  const packedItemsCount: number = packingItems.filter(item => item.packed).length;
  const progress: number = totalItems > 0 ? (packedItemsCount / totalItems) * 100 : 0;

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast({ title: "Item name cannot be empty", variant: "destructive", description: "Please enter a name for the packing item." });
      return;
    }
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in to add items.", variant: "destructive" });
        return;
    }
    setIsAddingItem(true);
    try {
      const itemToAdd = {
        name: newItemName.trim(),
        packed: false,
        addedBy: currentUser.uid,
        createdAt: FirestoreTimestamp.now(), // Firestore server timestamp
      };
      await addDoc(collection(db, 'trips', tripId, 'packingItems'), itemToAdd);

      toast({ title: "Item Added", description: `"${itemToAdd.name}" has been added to your packing list.` });
      setNewItemName('');
      onPackingAction(); // Refetch packing list
    } catch (error: any) {
      console.error("Error adding packing item:", error);
      toast({
        title: "Error Adding Item",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleTogglePacked = async (item: PackingListItem) => {
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in to update items.", variant: "destructive" });
        return;
    }
    const itemRef = doc(db, 'trips', tripId, 'packingItems', item.id);
    try {
      await updateDoc(itemRef, {
        packed: !item.packed,
        lastCheckedBy: currentUser.uid,
      });
      onPackingAction(); // Refetch packing list
    } catch (error: any) {
      console.error("Error updating packing item:", error);
      toast({
        title: "Error Updating Item",
        description: error.message || "Could not update item status.",
        variant: "destructive"
      });
    }
  };


 return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Packing List ({packedItemsCount}/{totalItems} packed)</h2>
      </div>
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="flex gap-2 mb-6">
            <Input
              placeholder="Add new packing item (e.g., Passport, Sunscreen)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              disabled={isAddingItem}
              className="flex-grow"
              aria-label="New packing item name"
            />
            <Button type="submit" disabled={isAddingItem || !newItemName.trim()} className="flex-shrink-0 shadow-sm hover:shadow-md transition-shadow">
              {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              <span className="hidden sm:inline ml-2">Add Item</span>
            </Button>
          </form>

          {totalItems > 0 && (
            <div className="mb-6">
              <Progress value={progress} aria-label={`Packing progress: ${packedItemsCount} of ${totalItems} items packed`} className="h-2.5"/>
              <p className="text-xs text-muted-foreground text-right mt-1">{packedItemsCount} / {totalItems} items packed ({Math.round(progress)}%)</p>
            </div>
          )}

          {packingItems && packingItems.length > 0 ? (
            <ul className="divide-y max-h-96 overflow-y-auto border rounded-md">
              {packingItems.map(item => (
                <li key={item.id} className="py-3 px-4 flex justify-between items-center hover:bg-muted/50 group">
                  <label htmlFor={`item-${item.id}`} className="flex items-center cursor-pointer flex-grow gap-3">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.packed}
                      onCheckedChange={() => handleTogglePacked(item)}
                      aria-label={`Mark ${item.name} as ${item.packed ? 'unpacked' : 'packed'}`}
                    />
                    <span className={`${item.packed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.name}</span>
                  </label>
                  {/* Future: Add delete button here, visible to item creator or trip owner */}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 border border-dashed rounded-md">
                 <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-semibold">Your packing list is empty.</p>
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
  const [cnFunction, setCnFunction] = useState<((...inputs: any[]) => string) | null>(null);

  useEffect(() => {
    import('@/lib/utils').then(utils => {
      setCnFunction(() => utils.cn);
    }).catch(err => console.error("Failed to load cn function from utils", err));
  }, []);


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

  const handleGenericAction = useCallback((queryKeys: string[]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key, tripId] });
      if (key === 'tripDetails') { // If trip details change, member list might have too
          queryClient.invalidateQueries({queryKey: ['memberDetails']}) // This will refetch all member details
          refetchTripDetails(); // Also refetch trip itself to get new member UIDs for useQueries
      }
    });
  }, [queryClient, tripId, refetchTripDetails]);


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

  const displayCurrencySymbol = trip.baseCurrency === 'INR' ? <IndianRupee className="inline-block h-5 w-5 mr-1" /> : trip.baseCurrency;


  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="relative h-56 md:h-80 rounded-xl overflow-hidden shadow-lg group">
        <Image
          src={trip.coverPhotoURL || `https://placehold.co/1200x400.png?text=${encodeURIComponent(trip.name)}`}
          alt={trip.name}
          fill
          style={{ objectFit: 'cover' }}
          className="brightness-75 group-hover:brightness-90 transition-all duration-300"
          data-ai-hint={trip.dataAiHint || 'travel landscape'}
          sizes="(max-width: 768px) 100vw, 1200px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white">
          <h1 className="text-3xl md:text-5xl font-bold drop-shadow-md">{trip.name}</h1>
          <p className="text-base md:text-lg text-gray-200 flex items-center mt-1 md:mt-2 drop-shadow-sm">
            <MapPin className="mr-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" /> {trip.destination}
          </p>
          <p className="text-xs md:text-sm text-gray-300 flex items-center mt-1 drop-shadow-sm">
            <CalendarDays className="mr-2 h-3 w-3 md:h-4 md:w-4 flex-shrink-0" /> {trip.startDate.toLocaleDateString()} - {trip.endDate.toLocaleDateString()}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-1 mb-6 shadow-sm bg-muted p-1 rounded-lg h-auto">
          <TabsTrigger value="overview" className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2">
            <BarChart3 className="h-4 w-4" /> <span className="hidden xs:hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2">
            <DollarSign className="h-4 w-4" /> <span className="hidden xs:hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2">
            <Users className="h-4 w-4" /> <span className="hidden xs:hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2">
            <FileText className="h-4 w-4" /> <span className="hidden xs:hidden sm:inline">Itinerary</span>
          </TabsTrigger>
          <TabsTrigger value="packing" className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2">
            <ListChecks className="h-4 w-4" /> <span className="hidden xs:hidden sm:inline">Packing</span>
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
              tripCurrency={trip.baseCurrency || 'INR'}
              onExpenseAction={() => handleGenericAction(['tripExpenses'])}
            />}
        </TabsContent>
        <TabsContent value="members">
          {isLoadingMembers || isLoadingTrip ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorMembers || errorTrip ? <p className="text-destructive">Error loading members: {(errorMembers || errorTrip)?.message}</p> :
           trip && <MembersTab trip={trip} members={members} onMemberAction={() => handleGenericAction(['tripDetails'])} />}
        </TabsContent>
        <TabsContent value="itinerary">
          {isLoadingItinerary ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorItinerary ? <p className="text-destructive">Error loading itinerary: {errorItinerary.message}</p> :
           <ItineraryTab tripId={tripId} itineraryEvents={itineraryEvents} onEventAction={() => handleGenericAction(['tripItinerary'])} />}
        </TabsContent>
        <TabsContent value="packing">
          {isLoadingPacking ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> :
           errorPacking ? <p className="text-destructive">Error loading packing list: {errorPacking.message}</p> :
           <PackingListTab tripId={tripId} packingItems={packingItems} onPackingAction={() => handleGenericAction(['tripPackingList'])} currentUser={currentUser} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
