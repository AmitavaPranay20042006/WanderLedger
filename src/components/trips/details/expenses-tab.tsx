
'use client';

import React, { useState, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, DollarSign } from 'lucide-react';
import AddExpenseModal from '@/components/trips/add-expense-modal';
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
import { useToast } from '@/hooks/use-toast';
import type { Trip, Expense, Member } from '@/lib/types/trip';

interface ExpensesTabProps {
  trip: Trip;
  expenses: Expense[] | undefined;
  members: Member[] | undefined;
  tripCurrency: string;
  onExpenseAction: () => void;
  currentUser: FirebaseUser | null;
}

export default function ExpensesTab({ trip, expenses, members, tripCurrency, onExpenseAction, currentUser }: ExpensesTabProps) {
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const { toast } = useToast();
  const displayCurrencySymbol = tripCurrency === 'INR' ? '₹' : tripCurrency;
  const isTripOwner = currentUser?.uid === trip.ownerId;

  const getMemberName = useCallback((uid: string) => members?.find(m => m.id === uid)?.displayName || uid.substring(0, 6) + "...", [members]);

  const getParticipantShareDetails = (expense: Expense) => {
    if (!members || !expense.participants || expense.participants.length === 0) return 'N/A';
    const payerName = getMemberName(expense.paidBy);
    const participantNames = expense.participants.map(uid => getMemberName(uid)).join(', ');
    const shareAmount = (expense.amount / expense.participants.length).toFixed(2);
    if (expense.participants.length === 1 && expense.participants[0] === expense.paidBy) {
      return `Paid by ${payerName} for themself.`;
    }
    return `Participants: ${participantNames}. Each owes ${displayCurrencySymbol}${shareAmount} to ${payerName}.`;
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete || !isTripOwner) return;
    try {
      const expenseRef = doc(db, 'trips', trip.id, 'expenses', expenseToDelete.id);
      await deleteDoc(expenseRef);
      toast({ title: "Expense Deleted", description: `"${expenseToDelete.description}" has been removed.` });
      onExpenseAction();
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast({ title: "Error Deleting Expense", description: error.message || "Could not delete expense.", variant: "destructive" });
    } finally {
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Expenses</h2>
        <Button
          onClick={() => setIsAddExpenseModalOpen(true)}
          className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {isAddExpenseModalOpen && members && (
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
          tripId={trip.id}
          members={members}
          tripCurrency={tripCurrency}
          onExpenseAdded={() => {
            onExpenseAction();
            setIsAddExpenseModalOpen(false);
          }}
        />
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
                        Paid by {getMemberName(exp.paidBy)} on {exp.date instanceof Date ? exp.date.toLocaleDateString() : new Date(exp.date.seconds * 1000).toLocaleDateString()}
                      </p>
                      <div className="text-lg font-medium mt-1 flex items-center">
                        <span>{exp.currency === 'INR' ? '₹' : exp.currency} {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{exp.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        {getParticipantShareDetails(exp)}
                      </p>
                      {exp.notes && <p className="text-xs text-muted-foreground/80 mt-1">Notes: {exp.notes}</p>}
                    </div>
                    {isTripOwner && (
                      <AlertDialog open={expenseToDelete?.id === exp.id} onOpenChange={(open) => { if (!open) setExpenseToDelete(null); }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive group-hover:opacity-100 sm:opacity-0 transition-opacity flex-shrink-0"
                            onClick={() => setExpenseToDelete(exp)}
                            aria-label={`Delete expense: ${exp.description}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense: {expenseToDelete?.description}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this expense? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setExpenseToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteExpense}
                              className={buttonVariants({ variant: "destructive" })}
                            >
                              Delete Expense
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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
