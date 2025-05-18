
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react'; // Added useEffect
import { CalendarIcon, Loader2, FileText, MapPinIcon, Tag, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, type Timestamp, type FieldValue } from 'firebase/firestore'; // Added FieldValue
import type { ItineraryEvent } from '@/app/trips/[tripId]/page';

const eventTypes = ['Activity', 'Flight', 'Train', 'Bus', 'Accommodation', 'Meeting Point', 'Note', 'Custom'];

const eventFormSchema = z.object({
  title: z.string().min(1, { message: 'Event title is required.' }).max(100),
  type: z.string().min(1, { message: 'Event type is required.' }),
  date: z.date({ required_error: 'Start date is required.' }),
  time: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
    message: "Time must be in HH:MM format (e.g., 14:30)."
  }),
  endDate: z.date().optional(),
  endTime: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
    message: "End time must be in HH:MM format."
  }),
  location: z.string().max(150).optional(),
  notes: z.string().max(1000).optional(),
}).refine(data => {
    if (data.endDate && data.date > data.endDate) {
        return false;
    }
    if (data.endDate && data.date.getTime() === data.endDate.getTime() && data.time && data.endTime && data.time > data.endTime) {
        return false;
    }
    return true;
}, {
    message: "End date/time cannot be before start date/time.",
    path: ["endDate"], 
});


type EventFormValues = z.infer<typeof eventFormSchema>;

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onEventAdded: () => void;
}

export default function AddEventModal({
  isOpen,
  onClose,
  tripId,
  onEventAdded,
}: AddEventModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      type: eventTypes[0],
      date: new Date(),
      time: '',
      endDate: undefined,
      endTime: '',
      location: '',
      notes: '',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: '',
        type: eventTypes[0],
        date: new Date(),
        time: '',
        endDate: undefined,
        endTime: '',
        location: '',
        notes: '',
      });
    }
  }, [isOpen, form]);


  const onSubmit = async (values: EventFormValues) => {
    setIsLoading(true);
    try {
      const combineDateAndTime = (date: Date, timeStr?: string): Date => {
        if (!timeStr) return date; // Return original date if no time string
        const [hours, minutes] = timeStr.split(':').map(Number);
        const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
        return newDate;
      };

      const startDateWithTime = combineDateAndTime(values.date, values.time);
      const endDateWithTime = values.endDate ? combineDateAndTime(values.endDate, values.endTime) : undefined;

      const payload: {
        title: string;
        type: string;
        date: Date; 
        createdAt: FieldValue;
        time?: string;
        endDate?: Date;
        location?: string;
        notes?: string;
      } = {
        title: values.title,
        type: values.type,
        date: startDateWithTime,
        createdAt: serverTimestamp(),
      };

      if (values.time) {
        payload.time = values.time;
      }
      if (endDateWithTime) {
        payload.endDate = endDateWithTime;
      }
      if (values.location) {
        payload.location = values.location;
      }
      if (values.notes) {
        payload.notes = values.notes;
      }
      // attachments are not yet part of the form

      await addDoc(collection(db, 'trips', tripId, 'itineraryEvents'), payload);
      toast({ title: 'Event Added!', description: `"${values.title}" has been added to the itinerary.` });
      onEventAdded();
      onClose();
    } catch (error: any) {
      console.error("Error adding event: ", error);
      toast({ variant: 'destructive', title: 'Error Adding Event', description: error.message || 'Failed to add event.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Itinerary Event</DialogTitle>
          <DialogDescription>
            Plan your trip by adding activities, flights, accommodations, and more.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4 pr-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Museum Visit, Dinner Reservation" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                     <div className="relative">
                       <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="time" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">HH:MM format (e.g., 09:30 or 14:00)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          disabled={(date) => date < (form.getValues("date") || new Date(new Date().setHours(0,0,0,0)))} // Ensure end date is not before start date
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="time" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">Only if End Date is set.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location/Address (Optional)</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g., Eiffel Tower, Paris or Flight BA245 Gate 3" {...field} className="pl-10" />
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description/Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any details, confirmation numbers, links, etc."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Event
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
