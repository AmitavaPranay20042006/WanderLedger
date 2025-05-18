
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarIcon, Loader2, MapPin, FileText, Image as ImageIcon, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added

const supportedCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']; // Example list

const tripFormSchema = z.object({
  name: z.string().min(3, { message: 'Trip name must be at least 3 characters.' }).max(100),
  destination: z.string().min(2, { message: 'Destination is required.' }).max(100),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  description: z.string().max(500).optional(),
  coverPhoto: z.instanceof(File).optional().nullable(),
  baseCurrency: z.string().min(3, {message: 'Currency is required.'}).max(3),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type TripFormValues = z.infer<typeof tripFormSchema>;

export default function CreateTripPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user: authUser } = useAuth();

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      name: '',
      destination: '',
      description: '',
      coverPhoto: null,
      baseCurrency: 'INR', // Default to INR
    },
  });

  const onSubmit = async (values: TripFormValues) => {
    setIsLoading(true);
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create a trip.' });
      setIsLoading(false);
      return;
    }

    try {
      let coverPhotoURL = `https://placehold.co/600x400.png?text=${encodeURIComponent(values.name)}`;
      let dataAiHint = `${values.destination.split(',')[0].trim().toLowerCase()} travel`;

      if (values.coverPhoto && values.coverPhoto instanceof File) {
        const photoFile = values.coverPhoto;
        const imageName = `${authUser.uid}-${Date.now()}-${photoFile.name}`;
        const storageRef = ref(storage, `trip-covers/${imageName}`);
        
        const uploadTask = await uploadBytes(storageRef, photoFile);
        coverPhotoURL = await getDownloadURL(uploadTask.ref);
        dataAiHint = `${values.destination.split(',')[0].trim().toLowerCase()} photo`; 
      }

      const tripData = {
        name: values.name,
        destination: values.destination,
        startDate: values.startDate,
        endDate: values.endDate,
        description: values.description || '',
        coverPhotoURL,
        dataAiHint,
        baseCurrency: values.baseCurrency,
        ownerId: authUser.uid,
        members: [authUser.uid], 
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'trips'), tripData);
      toast({ title: 'Trip Created!', description: `Your trip "${values.name}" has been successfully created.` });
      router.push(`/trips/${docRef.id}`);
    } catch (error: any) {
      console.error("Error creating trip: ", error);
      toast({ variant: 'destructive', title: 'Error Creating Trip', description: error.message || 'Failed to create trip. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Plan Your Next Adventure</CardTitle>
          <CardDescription>Fill in the details below to create your new trip.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Himalayan Expedition" {...field} />
                    </FormControl>
                    <FormDescription>Give your trip a memorable name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination(s)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g., Leh, Ladakh, India" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                     <FormDescription>Where are you heading?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="baseCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Currency</FormLabel>
                     <div className="relative">
                       <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select trip currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supportedCurrencies.map(currency => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormDescription>Select the primary currency for this trip.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Description (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          placeholder="Add any notes, goals, or important details about your trip."
                          className="resize-none pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverPhoto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Photo (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} 
                            className="pl-10 file:text-primary file:font-semibold file:mr-2" 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Upload an image to represent your trip.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || !authUser}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Trip
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
