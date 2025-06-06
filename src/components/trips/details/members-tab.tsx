
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { UserPlus, UserMinus } from 'lucide-react';
import InviteMemberModal from '@/components/trips/invite-member-modal';
import { useToast } from '@/hooks/use-toast';
import type { Trip, Member } from '@/lib/types/trip';

interface MembersTabProps {
  trip: Trip;
  fetchedMembers: Member[] | undefined; // Renamed from 'members' to match original prop name
  onMemberAction: () => void;
}

export default function MembersTab({ trip, fetchedMembers, onMemberAction }: MembersTabProps) {
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
            <UserMinus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-semibold">No members found.</p>
            {isTripOwner && <p className="text-sm text-muted-foreground mt-1">Invite members to start collaborating!</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
