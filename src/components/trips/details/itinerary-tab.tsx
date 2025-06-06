
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, MapPinIcon, CalendarClock, Edit2, Trash2 } from 'lucide-react';
import AddEventModal from '@/components/trips/add-event-modal';
import { cn } from '@/lib/utils';
import type { ItineraryEvent } from '@/lib/types/trip';
import { format, isSameDay, isValid, parseISO } from 'date-fns';

interface ItineraryTabProps {
  tripId: string;
  itineraryEvents: ItineraryEvent[] | undefined;
  onEventAction: () => void;
  tripStartDate?: Date;
  tripEndDate?: Date;
}

const getEventTypeStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case 'flight': return "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700";
    case 'train': return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700";
    case 'bus': return "bg-lime-100 text-lime-700 border-lime-300 dark:bg-lime-900/50 dark:text-lime-300 dark:border-lime-700";
    case 'accommodation': return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700";
    case 'activity': return "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700";
    case 'meeting point': return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700";
    case 'note': return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600";
    default: return "bg-secondary text-secondary-foreground border-border";
  }
};

const ensureDateObject = (dateInput: any): Date | null => {
  if (dateInput instanceof Date && isValid(dateInput)) {
    return dateInput;
  }
  if (dateInput && typeof dateInput.seconds === 'number') {
    const d = new Date(dateInput.seconds * 1000);
    return isValid(d) ? d : null;
  }
  if (typeof dateInput === 'string') {
    const d = parseISO(dateInput); // Try parsing ISO string
    return isValid(d) ? d : null;
  }
  if (typeof dateInput === 'number') { // Handle timestamps
    const d = new Date(dateInput);
    return isValid(d) ? d : null;
  }
  return null;
};


export default function ItineraryTab({ tripId, itineraryEvents, onEventAction, tripStartDate, tripEndDate }: ItineraryTabProps) {
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  const sortedEvents = useMemo(() => {
    if (!itineraryEvents) return [];
    return itineraryEvents
      .map(event => ({
        ...event,
        validStartDate: ensureDateObject(event.date),
        validEndDate: event.endDate ? ensureDateObject(event.endDate) : null,
      }))
      .filter(event => event.validStartDate !== null) // Filter out events with invalid start dates
      .sort((a, b) => {
        // At this point, a.validStartDate and b.validStartDate are guaranteed to be valid Date objects
        if (a.validStartDate!.getTime() !== b.validStartDate!.getTime()) {
          return a.validStartDate!.getTime() - b.validStartDate!.getTime();
        }
        const timeA = typeof a.time === 'string' ? a.time : "00:00";
        const timeB = typeof b.time === 'string' ? b.time : "00:00";
        return timeA.localeCompare(timeB);
      });
  }, [itineraryEvents]);


  const groupedEvents = useMemo(() => {
    return sortedEvents.reduce((acc, event) => {
      // event.validStartDate is already a valid Date object here
      const dateStr = format(event.validStartDate!, "eeee, MMMM do, yyyy");
      if (!acc[dateStr]) {
        acc[dateStr] = { events: [], originalDate: event.validStartDate! };
      }
      acc[dateStr].events.push(event);
      return acc;
    }, {} as Record<string, { events: (ItineraryEvent & { validStartDate: Date | null; validEndDate: Date | null; })[], originalDate: Date }>);
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
        />
      )}

      {Object.keys(groupedEvents).length > 0 ? (
        Object.entries(groupedEvents).map(([dateStr, { events: eventsOnDate, originalDate }]) => (
          <div key={dateStr} className="relative pl-8 py-4 group animate-fade-in-up">
            <div className="absolute left-0 top-5 w-8 h-8 bg-primary text-primary-foreground rounded-full flex flex-col items-center justify-center shadow-md -translate-x-1/2">
                <span className="text-xs font-semibold">{format(originalDate, 'MMM')}</span>
                <span className="text-sm font-bold -mt-1">{format(originalDate, 'dd')}</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 ml-4 text-primary">{dateStr}</h3>
            <div className="space-y-4 ml-4 border-l-2 border-border dark:border-gray-700 pl-8 ">
              {eventsOnDate.map(event => {
                // event.validStartDate and event.validEndDate are available here
                return (
                  <Card key={event.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative group/item dark:bg-gray-800">
                     <div className={`absolute top-0 left-0 h-full w-1.5 ${getEventTypeStyle(event.type).split(' ')[0].replace('dark:','')}`}></div> {/* Color bar */}
                    <CardContent className="p-5 pl-7">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-grow">
                          <div className="flex items-center mb-1.5 flex-wrap">
                            {event.time && <p className="text-sm font-semibold text-primary mr-3 flex items-center"><CalendarClock className="h-4 w-4 mr-1.5 opacity-80"/>{event.time}{event.endTime && ` - ${event.endTime}`}</p>}
                            <Badge variant="outline" className={`${getEventTypeStyle(event.type)} font-medium text-xs px-2 py-0.5`}>{event.type}</Badge>
                          </div>
                          <h4 className="font-semibold text-lg text-foreground dark:text-gray-100">{event.title}</h4>
                          {event.location && <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 flex items-center"><MapPinIcon className="h-4 w-4 mr-1.5 opacity-70" /> {event.location}</p>}
                        </div>
                      </div>
                      {event.notes && <p className="text-sm text-muted-foreground/90 dark:text-gray-300 mt-2.5 pt-2.5 border-t border-dashed dark:border-gray-700 whitespace-pre-wrap">{event.notes}</p>}
                      {event.validEndDate && event.validStartDate && !isSameDay(event.validStartDate, event.validEndDate) && !event.time &&
                        <p className="text-xs text-muted-foreground/80 dark:text-gray-500 mt-2">Until: {format(event.validEndDate, "MMMM do, yyyy")}</p>
                      }
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <Card className="text-center py-16 shadow-sm border-dashed dark:bg-gray-800 dark:border-gray-700 mt-8">
          <CardContent>
            <FileText className="mx-auto h-16 w-16 text-muted-foreground/70 dark:text-gray-500 mb-6" />
            <p className="text-xl text-muted-foreground dark:text-gray-400 font-semibold">Your itinerary is looking a bit empty.</p>
            <p className="text-base text-muted-foreground dark:text-gray-500 mt-2">Start planning by adding flights, accommodations, or activities!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

