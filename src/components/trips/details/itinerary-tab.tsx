
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, MapPinIcon, CalendarClock, Edit2, Trash2 } from 'lucide-react';
import AddEventModal from '@/components/trips/add-event-modal';
import { cn } from '@/lib/utils';
import type { ItineraryEvent } from '@/lib/types/trip';
import { format, isSameDay } from 'date-fns';

interface ItineraryTabProps {
  tripId: string;
  itineraryEvents: ItineraryEvent[] | undefined;
  onEventAction: () => void;
  tripStartDate?: Date;
  tripEndDate?: Date;
}

const getEventTypeStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case 'flight': return "bg-sky-100 text-sky-700 border-sky-300";
    case 'train': return "bg-orange-100 text-orange-700 border-orange-300";
    case 'bus': return "bg-lime-100 text-lime-700 border-lime-300";
    case 'accommodation': return "bg-purple-100 text-purple-700 border-purple-300";
    case 'activity': return "bg-teal-100 text-teal-700 border-teal-300";
    case 'meeting point': return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case 'note': return "bg-gray-100 text-gray-700 border-gray-300";
    default: return "bg-secondary text-secondary-foreground border-border";
  }
};

export default function ItineraryTab({ tripId, itineraryEvents, onEventAction, tripStartDate, tripEndDate }: ItineraryTabProps) {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  // const [eventToEdit, setEventToEdit] = useState<ItineraryEvent | null>(null); // For future edit functionality
  // const [eventToDelete, setEventToDelete] = useState<ItineraryEvent | null>(null); // For future delete functionality

  const sortedEvents = useMemo(() => {
    return itineraryEvents?.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date.seconds * 1000);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date.seconds * 1000);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return (a.time || "00:00").localeCompare(b.time || "00:00");
    }) || [];
  }, [itineraryEvents]);


  const groupedEvents = useMemo(() => {
    return sortedEvents.reduce((acc, event) => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date.seconds * 1000);
      const dateStr = format(eventDate, "eeee, MMMM do, yyyy");
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(event);
      return acc;
    }, {} as Record<string, ItineraryEvent[]>);
  }, [sortedEvents]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold tracking-tight">Trip Itinerary</h2>
        <Button
          onClick={() => setIsAddEventModalOpen(true)}
          className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5">
          <PlusCircle className="mr-2 h-5 w-5" /> Add Itinerary Event
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
          // Pass trip dates to pre-fill or constrain calendar in modal
          // defaultDate={tripStartDate}
          // minDate={tripStartDate}
          // maxDate={tripEndDate}
        />
      )}
      {/* Future Edit/Delete Modals would go here */}

      {Object.keys(groupedEvents).length > 0 ? (
        Object.entries(groupedEvents).map(([dateStr, eventsOnDate]) => (
          <div key={dateStr} className="relative pl-8 py-4 group animate-fade-in-up">
            {/* Date Marker */}
            <div className="absolute left-0 top-5 w-8 h-8 bg-primary text-primary-foreground rounded-full flex flex-col items-center justify-center shadow-md -translate-x-1/2">
                <span className="text-xs font-semibold">{format(new Date(dateStr.split(', ')[1]), 'MMM')}</span>
                <span className="text-sm font-bold -mt-1">{format(new Date(dateStr.split(', ')[1]), 'dd')}</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 ml-4 text-primary">{dateStr}</h3>
            <div className="space-y-4 ml-4 border-l-2 border-border pl-8 ">
              {eventsOnDate.map(event => {
                const eventDate = event.date instanceof Date ? event.date : new Date(event.date.seconds * 1000);
                const eventEndDate = event.endDate && (event.endDate instanceof Date ? event.endDate : new Date(event.endDate.seconds * 1000));
                return (
                  <Card key={event.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative group/item">
                     <div className={`absolute top-0 left-0 h-full w-1.5 ${getEventTypeStyle(event.type).split(' ')[0]}`}></div> {/* Color bar */}
                    <CardContent className="p-5 pl-7"> {/* Increased padding */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-grow">
                          <div className="flex items-center mb-1.5">
                            {event.time && <p className="text-sm font-semibold text-primary mr-3 flex items-center"><CalendarClock className="h-4 w-4 mr-1.5 opacity-80"/>{event.time}{event.endTime && ` - ${event.endTime}`}</p>}
                            <Badge variant="outline" className={`${getEventTypeStyle(event.type)} font-medium`}>{event.type}</Badge>
                          </div>
                          <h4 className="font-semibold text-lg text-foreground">{event.title}</h4>
                          {event.location && <p className="text-sm text-muted-foreground mt-1 flex items-center"><MapPinIcon className="h-4 w-4 mr-1.5 opacity-70" /> {event.location}</p>}
                        </div>
                        {/* Future Action Buttons */}
                        {/* <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity absolute top-3 right-3">
                            <Button variant="outline" size="icon" onClick={() => setEventToEdit(event)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon" onClick={() => setEventToDelete(event)}><Trash2 className="h-4 w-4" /></Button>
                        </div> */}
                      </div>
                      {event.notes && <p className="text-sm text-muted-foreground/90 mt-2.5 pt-2.5 border-t border-dashed whitespace-pre-wrap">{event.notes}</p>}
                      {eventEndDate && !isSameDay(eventDate, eventEndDate) && !event.time &&
                        <p className="text-xs text-muted-foreground/80 mt-2">Until: {format(eventEndDate, "MMMM do, yyyy")}</p>
                      }
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <Card className="text-center py-16 shadow-sm border-dashed mt-8">
          <CardContent>
            <FileText className="mx-auto h-16 w-16 text-muted-foreground/70 mb-6" />
            <p className="text-xl text-muted-foreground font-semibold">Your itinerary is looking a bit empty.</p>
            <p className="text-base text-muted-foreground mt-2">Start planning by adding flights, accommodations, or activities!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
