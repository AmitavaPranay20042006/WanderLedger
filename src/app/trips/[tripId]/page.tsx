'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, ListChecks, MapPin, PlusCircle, BarChart3, Sparkles, FileText, CalendarDays, Settings } from 'lucide-react';
import Image from 'next/image';

// Mock data for a single trip - replace with actual data fetching
const mockTripData = {
  id: '1',
  name: 'Paris Adventure',
  destination: 'Paris, France',
  startDate: '2024-09-15',
  endDate: '2024-09-22',
  description: 'An amazing week exploring the city of lights, visiting iconic landmarks, enjoying delicious food, and soaking in the culture.',
  coverPhotoURL: 'https://placehold.co/1200x400.png?text=Eiffel+Tower+View',
  dataAiHint: 'paris eiffel tower',
  totalExpenses: 2500, // Mock
  yourSpending: 600, // Mock
  netBalance: -50, // Mock: You owe 50
  members: [
    { id: 'user1', name: 'Alice', avatar: 'https://placehold.co/40x40.png?text=A', dataAiHint:'person' },
    { id: 'user2', name: 'Bob', avatar: 'https://placehold.co/40x40.png?text=B', dataAiHint:'person' },
    { id: 'user3', name: 'You', avatar: 'https://placehold.co/40x40.png?text=Y', dataAiHint:'person' },
  ],
  expenses: [
    { id: 'exp1', description: 'Dinner at Le Jules Verne', amount: 300, paidBy: 'Alice', date: '2024-09-16', category: 'Food' },
    { id: 'exp2', description: 'Louvre Museum Tickets', amount: 90, paidBy: 'Bob', date: '2024-09-17', category: 'Activities' },
    { id: 'exp3', description: 'Metro Passes', amount: 60, paidBy: 'You', date: '2024-09-15', category: 'Transport' },
  ],
  packingList: { total: 20, checked: 15 }, // Mock
  itinerary: [ // Mock
    {id: 'event1', title: 'Arrival & Check-in', date: '2024-09-15', type: 'Travel'},
    {id: 'event2', title: 'Eiffel Tower Visit', date: '2024-09-16', type: 'Activity'},
  ]
};

// TODO: Create these components
function TripOverviewTab({ trip }: { trip: typeof mockTripData }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trip Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
            <p className="text-2xl font-bold">${trip.totalExpenses.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Your Spending</h3>
            <p className="text-2xl font-bold">${trip.yourSpending.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Your Net Balance</h3>
            <p className={`text-2xl font-bold ${trip.netBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {trip.netBalance < 0 ? `Owe $${Math.abs(trip.netBalance).toLocaleString()}` : `Owed $${trip.netBalance.toLocaleString()}`}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{trip.description}</p>
        </CardContent>
      </Card>
      {/* Add charts here later for expense breakdown / spending by member */}
    </div>
  );
}

function ExpensesTab({ trip }: { trip: typeof mockTripData }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Expenses</h2>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Expense</Button>
      </div>
      {trip.expenses.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {trip.expenses.map(exp => (
                <li key={exp.id} className="p-4 hover:bg-muted/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{exp.description}</p>
                      <p className="text-sm text-muted-foreground">Paid by {exp.paidBy} on {new Date(exp.date).toLocaleDateString()} - ${exp.amount}</p>
                    </div>
                    <Badge variant="outline">{exp.category}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">No expenses recorded yet.</p>
      )}
      <Button variant="accent" className="w-full md:w-auto">
        <Sparkles className="mr-2 h-4 w-4" /> Suggest Debt Settlement (AI)
      </Button>
    </div>
  );
}
import { Badge } from "@/components/ui/badge"; // Add this import for ExpensesTab

function MembersTab({ trip }: { trip: typeof mockTripData }) {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Trip Members ({trip.members.length})</h2>
        <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Invite Member</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {trip.members.map(member => (
              <li key={member.id} className="p-4 flex items-center space-x-3 hover:bg-muted/50">
                <Image src={member.avatar} alt={member.name} width={40} height={40} className="rounded-full" data-ai-hint={member.dataAiHint} />
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.id === 'user3' ? 'Admin (You)' : 'Member'}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ItineraryTab({ trip }: { trip: typeof mockTripData }) {
 return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Itinerary</h2>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Event</Button>
      </div>
      {trip.itinerary.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {trip.itinerary.map(event => (
                <li key={event.id} className="p-4 hover:bg-muted/50">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()} - {event.type}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
         <p className="text-muted-foreground">No itinerary items added yet.</p>
      )}
    </div>
  );
}

function PackingListTab({ trip }: { trip: typeof mockTripData }) {
 return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Packing List ({trip.packingList.checked}/{trip.packingList.total} packed)</h2>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
      </div>
      <Card>
        <CardContent>
          {/* Placeholder for packing list items */}
          <p className="text-muted-foreground py-8 text-center">Packing list items will appear here. Check off items as you pack them!</p>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${(trip.packingList.checked / trip.packingList.total) * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const trip = mockTripData; // Use mock data for now, fetch by tripId later

  if (!trip) {
    return <p>Loading trip data or trip not found...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-lg">
        <Image 
          src={trip.coverPhotoURL} 
          alt={trip.name} 
          layout="fill" 
          objectFit="cover" 
          className="brightness-75"
          data-ai-hint={trip.dataAiHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
          <h1 className="text-3xl md:text-5xl font-bold">{trip.name}</h1>
          <p className="text-lg md:text-xl text-gray-200 flex items-center mt-2">
            <MapPin className="mr-2 h-5 w-5" /> {trip.destination}
          </p>
          <p className="text-sm text-gray-300 flex items-center mt-1">
            <CalendarDays className="mr-2 h-4 w-4" /> {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" className="absolute top-4 right-4 bg-background/80 hover:bg-background text-foreground">
            <Settings className="mr-2 h-4 w-4" /> Trip Settings
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
          <TabsTrigger value="overview"><BarChart3 className="mr-1 sm:mr-2 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="expenses"><DollarSign className="mr-1 sm:mr-2 h-4 w-4" />Expenses</TabsTrigger>
          <TabsTrigger value="members"><Users className="mr-1 sm:mr-2 h-4 w-4" />Members</TabsTrigger>
          <TabsTrigger value="itinerary"><FileText className="mr-1 sm:mr-2 h-4 w-4" />Itinerary</TabsTrigger>
          <TabsTrigger value="packing"><ListChecks className="mr-1 sm:mr-2 h-4 w-4" />Packing List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <TripOverviewTab trip={trip} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab trip={trip} />
        </TabsContent>
        <TabsContent value="members">
          <MembersTab trip={trip} />
        </TabsContent>
        <TabsContent value="itinerary">
          <ItineraryTab trip={trip} />
        </TabsContent>
        <TabsContent value="packing">
          <PackingListTab trip={trip} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
