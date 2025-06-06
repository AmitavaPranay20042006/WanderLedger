
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, MapPinIcon } from 'lucide-react';
import AddEventModal from '@/components/trips/add-event-modal';
import { cn } from '@/lib/utils';
import type { ItineraryEvent } from '@/lib/types/trip';

interface ItineraryTabProps {
  tripId: string;
  itineraryEvents: ItineraryEvent[] | undefined;
  onEventAction: () => void;
}

export default function ItineraryTab({ tripId, itineraryEvents, onEventAction }: ItineraryTabProps) {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  const groupedEvents = itineraryEvents?.reduce((acc, event) => {
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date.seconds * 1000);
    const dateStr = eventDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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

      {groupedEvents && Object.keys(groupedEvents).length > 0 ? (
        Object.entries(groupedEvents).map(([dateStr, eventsOnDate]) => (
          <Card key={dateStr} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{dateStr}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {eventsOnDate.sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00")).map(event => {
                  const eventDate = event.date instanceof Date ? event.date : new Date(event.date.seconds * 1000);
                  const eventEndDate = event.endDate && (event.endDate instanceof Date ? event.endDate : new Date(event.endDate.seconds * 1000));
                  return (
                    <li key={event.id} className="p-4 hover:bg-muted/50">
                      <div className="flex items-start gap-3">
                        {event.time && <p className="text-sm font-medium text-primary w-16 pt-0.5">{event.time}</p>}
                        <div className={cn("flex-grow", event.time ? "border-l pl-3" : "")}>
                          <div className="font-semibold flex items-center">
                            <span>{event.title}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">{event.type}</Badge>
                          </div>
                          {event.location && <p className="text-xs text-muted-foreground mt-1 flex items-center"><MapPinIcon className="h-3 w-3 mr-1.5" /> {event.location}</p>}
                          {event.notes && <p className="text-sm text-muted-foreground/90 mt-1 whitespace-pre-wrap">{event.notes}</p>}
                          {eventEndDate && eventEndDate.getTime() > eventDate.getTime() && !event.time &&
                            <p className="text-xs text-muted-foreground/70 mt-0.5">Until: {eventEndDate.toLocaleDateString()}</p>
                          }
                        </div>
                      </div>
                    </li>
                  );
                })}
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
