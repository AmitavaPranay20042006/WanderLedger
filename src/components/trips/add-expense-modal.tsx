
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { CalendarIcon, Loader2, DollarSign, StickyNote, Users, Tag, UserSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'; // Ensure Timestamp and serverTimestamp are imported
import type { Member } from '@/app/trips/[tripId]/page';
import { useAuth } from '@/contexts/auth-context';

const expenseCategories = ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Miscellaneous'];

// Zod schema for client-side validation
const expenseFormSchema = z.object({
  description: z.string().min(1, { message: 'Description is required.' }).max(100),
  amount: z.coerce.number().min(0.01, { message: 'Amount must be greater than 0.' }),
  date: z.date({ required_error: 'Date is required.' }),
  paidBy: z.string().min(1, { message: 'Payer is required.' }), // Should be current user's UID for simplified rule
  category: z.string().min(1, { message: 'Category is required.' }),
  participants: z.array(z.string()).min(1, { message: 'At least one participant is required.' }),
  notes: z.string().max(500).optional().default(''), // Ensure notes default to empty string if not provided
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  members: Member[];
  tripCurrency: string;
  onExpenseAdded: () => void;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  tripId,
  members,
  tripCurrency,
  onExpenseAdded,
}: AddExpenseModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user: authUser } = useAuth();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
      paidBy: authUser?.uid || '',
      category: expenseCategories[0],
      participants: members.map(m => m.id),
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        description: '',
        amount: 0,
        date: new Date(),
        paidBy: authUser?.uid || (members.length > 0 ? members[0].id : ''),
        category: expenseCategories[0],
        participants: members.map(m => m.id),
        notes: '',
      });
    }
  }, [isOpen, form, authUser, members]);


  const onSubmit = async (values: ExpenseFormValues) => {
    setIsLoading(true);
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      setIsLoading(false);
      return;
    }
    if (!tripId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Trip ID is missing.' });
        setIsLoading(false);
        return;
    }

    // Ensure paidBy is current user for simplified rule
    if (values.paidBy !== authUser.uid) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'For this operation, the payer must be the current user.' });
        setIsLoading(false);
        // Optionally, you could force values.paidBy = authUser.uid here if the UI doesn't enforce it
        // but it's better if the form defaults and doesn't allow changing paidBy if rule is strict.
        // For now, we assume the form ensures paidBy is the authUser.uid or we error out.
        // Let's ensure paidBy for the payload IS the authUser.uid to match the simplified rule.
        // This might override user selection if the "Paid By" dropdown was changeable.
    }


    const expenseDataPayload: { [key: string]: any } = {
      description: values.description.trim(),
      amount: values.amount,
      currency: tripCurrency,
      date: Timestamp.fromDate(values.date), // Convert JS Date to Firestore Timestamp
      paidBy: authUser.uid, // CRITICAL: Ensure this matches authUser.uid for simplified rule
      category: values.category,
      participants: values.participants,
      splitType: 'equally', // Defaulting to 'equally' as per form structure
      notes: values.notes?.trim() || '', // Ensure notes is empty string if undefined or just whitespace
      createdAt: serverTimestamp(), // CRITICAL for server timestamp rule
    };
    
    console.log('--- Add Expense Attempt ---');
    console.log('Current User UID:', authUser.uid);
    console.log('Trip ID:', tripId);
    console.log('Payload being sent to Firestore (stringified):', JSON.stringify(expenseDataPayload, null, 2));
    // Log objects that don't stringify well separately
    console.log('Payload "date" field (Timestamp object):', expenseDataPayload.date);
    console.log('Payload "createdAt" field (ServerTimestamp placeholder):', expenseDataPayload.createdAt);


    try {
      const expensesCollectionRef = collection(db, 'trips', tripId, 'expenses');
      await addDoc(expensesCollectionRef, expenseDataPayload);
      
      toast({ title: 'Expense Added!', description: `"${values.description}" has been added.` });
      onExpenseAdded();
      onClose();
    } catch (error: any) {
      console.error("Error adding expense: ", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error Adding Expense', 
        description: error.message || 'Failed to add expense. Check console for details.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Expense</DialogTitle>
          <DialogDescription>
            Enter the details of the expense for your trip.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 pr-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <StickyNote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="e.g., Lunch at the beach" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({tripCurrency})</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-10" 
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Expense</FormLabel>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paidBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid By</FormLabel>
                    <div className="relative">
                      <UserSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Select 
                        onValueChange={(value) => {
                           field.onChange(value);
                           // For simplified rule, we force paidBy to be authUser.uid in payload
                           // but form can still reflect user's choice if dropdown is enabled.
                        }} 
                        defaultValue={field.value}
                        // To strictly enforce the simplified rule, disable this if authUser is present
                        // disabled={!!authUser} 
                      >
                        <FormControl>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select who paid" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormDescription className="text-xs">With simplified rules, payer must be you.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                     <div className="relative">
                       <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="participants"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">Participants</FormLabel>
                    <FormDescription>
                      Select who participated in this expense.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border rounded-md">
                  {members.map((member) => (
                    <FormField
                      key={member.id}
                      control={form.control}
                      name="participants"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={member.id}
                            className="flex flex-row items-center space-x-2 space-y-0 bg-muted/50 p-2 rounded-md"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(member.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), member.id])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== member.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {member.displayName}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional details about the expense..."
                      className="resize-none"
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
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    