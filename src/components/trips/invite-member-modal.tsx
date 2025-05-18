
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Mail, UserPlus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import type { Member } from '@/app/trips/[tripId]/page';

const inviteMemberFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberFormSchema>;

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currentMembers: string[]; // Array of UIDs
  onMemberInvited: () => void;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  tripId,
  currentMembers,
  onMemberInvited,
}: InviteMemberModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ email: '' });
    }
  }, [isOpen, form]);

  const onSubmit = async (values: InviteMemberFormValues) => {
    setIsLoading(true);
    try {
      const lowercasedEmail = values.email.toLowerCase();
      // 1. Find user by email in the 'users' collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', lowercasedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'User Not Found',
          description: `No user found with the email ${values.email}. Users must have an existing WanderLedger account.`,
        });
        setIsLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      if (!userData) {
        // This case should be rare if querySnapshot is not empty, but good for robustness
        toast({
          variant: 'destructive',
          title: 'User Data Error',
          description: `Could not retrieve data for user ${values.email}.`,
        });
        setIsLoading(false);
        return;
      }
      
      const userIdToAdd = userDoc.id;
      const userDisplayName = userData.displayName || values.email;

      // 2. Check if user is already a member
      if (currentMembers.includes(userIdToAdd)) {
        toast({
          variant: 'default',
          title: 'Already a Member',
          description: `${userDisplayName} is already a member of this trip.`,
        });
        setIsLoading(false);
        return;
      }

      // 3. Add user's UID to the trip's members array
      const tripRef = doc(db, 'trips', tripId);
      await updateDoc(tripRef, {
        members: arrayUnion(userIdToAdd),
      });

      toast({ title: 'Member Added!', description: `${userDisplayName} has been added to the trip.` });
      onMemberInvited(); // This should trigger a refetch in the parent component
      onClose();
    } catch (error: any) {
      console.error("Error inviting member: ", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error Adding Member', 
        description: error.message || 'Failed to add member. Please check console for details or ensure the user exists.' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Invite New Member</DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to add to this trip. They must have an existing WanderLedger account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User's Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="name@example.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
