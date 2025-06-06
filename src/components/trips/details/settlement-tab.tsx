
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
import { IndianRupee, ArrowRight, CheckSquare, Scale, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Trip, Expense, Member, RecordedPayment, SettlementTransaction, MemberFinancials } from '@/lib/types/trip';

interface SettlementTabProps {
  trip: Trip;
  expenses: Expense[] | undefined;
  members: Member[] | undefined;
  recordedPayments: RecordedPayment[] | undefined;
  currentUser: FirebaseUser | null;
  onAction: () => void;
}

export default function SettlementTab({ trip, expenses, members, recordedPayments, currentUser, onAction }: SettlementTabProps) {
  const displayCurrencySymbol = trip.baseCurrency === 'INR' ? <IndianRupee className="inline-block h-5 w-5 relative -top-px mr-0.5" /> : trip.baseCurrency;
  const getMemberName = useCallback((uid: string) => members?.find(m => m.id === uid)?.displayName || uid.substring(0, 6) + "...", [members]);
  const { toast } = useToast();
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentToRecordDetails, setPaymentToRecordDetails] = useState<SettlementTransaction | null>(null);
  const [recordPaymentNotes, setRecordPaymentNotes] = useState('');

  const memberFinancials = useMemo((): MemberFinancials[] => {
    if (!members || members.length === 0) return [];

    const financials: Record<string, { paid: number, share: number, initialNet: number, adjustedNet: number }> = {};
    members.forEach(member => {
      financials[member.id] = { paid: 0, share: 0, initialNet: 0, adjustedNet: 0 };
    });

    if (expenses) {
      expenses.forEach(expense => {
        if (financials[expense.paidBy]) {
          financials[expense.paidBy].paid += expense.amount;
        }
        const sharePerParticipant = expense.amount / (expense.participants.length || 1);
        expense.participants.forEach(participantId => {
          if (financials[participantId]) {
            financials[participantId].share += sharePerParticipant;
          }
        });
      });
    }

    members.forEach(member => {
      const memberData = financials[member.id];
      memberData.initialNet = memberData.paid - memberData.share;
      memberData.adjustedNet = memberData.initialNet;
    });

    if (recordedPayments) {
      recordedPayments.forEach(payment => {
        if (financials[payment.fromUserId]) {
          financials[payment.fromUserId].adjustedNet += payment.amount;
        }
        if (financials[payment.toUserId]) {
          financials[payment.toUserId].adjustedNet -= payment.amount;
        }
      });
    }

    return members.map(member => {
      const memberData = financials[member.id];
      return {
        memberId: member.id,
        memberName: getMemberName(member.id),
        totalPaid: memberData.paid,
        totalShare: memberData.share,
        initialNetBalance: memberData.initialNet,
        netBalance: memberData.adjustedNet,
      };
    }).sort((a, b) => b.netBalance - a.netBalance);
  }, [expenses, members, recordedPayments, getMemberName]);

  const settlementTransactions = useMemo((): SettlementTransaction[] => {
    if (!memberFinancials || memberFinancials.length === 0) return [];

    const transactions: SettlementTransaction[] = [];
    const balancesCopy = JSON.parse(JSON.stringify(memberFinancials.map(mf => ({
      id: mf.memberId,
      name: mf.memberName,
      balance: mf.netBalance
    }))));

    let debtors = balancesCopy.filter((m: any) => m.balance < -0.005).sort((a: any, b: any) => a.balance - b.balance);
    let creditors = balancesCopy.filter((m: any) => m.balance > 0.005).sort((a: any, b: any) => b.balance - a.balance);

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amountToTransfer = Math.min(-debtor.balance, creditor.balance);

      if (amountToTransfer > 0.005) {
        transactions.push({
          fromUserId: debtor.id,
          from: debtor.name,
          toUserId: creditor.id,
          to: creditor.name,
          amount: amountToTransfer
        });

        debtor.balance += amountToTransfer;
        creditor.balance -= amountToTransfer;
      }

      if (Math.abs(debtor.balance) < 0.005) debtorIndex++;
      if (Math.abs(creditor.balance) < 0.005) creditorIndex++;
    }
    return transactions;
  }, [memberFinancials]);

  const handleRecordPayment = async () => {
    if (!currentUser || !trip) {
      toast({ title: "Error", description: "User or trip data is not available.", variant: "destructive" });
      return;
    }
    if (!paymentToRecordDetails) {
      toast({ title: "Error", description: "Payment details are missing.", variant: "destructive" });
      return;
    }
    const clientSideBaseCurrency = trip.baseCurrency || 'INR'; // Default if undefined, though should be set
    if (!clientSideBaseCurrency || clientSideBaseCurrency.length !== 3) {
        console.error(`Critical Error: Client-side trip.baseCurrency for trip ID ${trip.id} is invalid. Value: "${trip.baseCurrency}". Cannot record payment.`);
        toast({
            title: "Trip Configuration Error",
            description: `The base currency ("${trip.baseCurrency || 'Not set'}") for this trip is not set up correctly. Cannot record payment.`,
            variant: "destructive",
            duration: 10000,
        });
        return;
    }

    setIsRecordingPayment(true);
    const paymentData = {
      fromUserId: paymentToRecordDetails.fromUserId,
      toUserId: paymentToRecordDetails.toUserId,
      amount: paymentToRecordDetails.amount,
      currency: clientSideBaseCurrency,
      dateRecorded: serverTimestamp(),
      recordedBy: currentUser.uid,
      notes: recordPaymentNotes.trim() || '',
    };

    try {
      await addDoc(collection(db, 'trips', trip.id, 'recordedPayments'), paymentData);
      toast({ title: "Payment Recorded", description: `Payment from ${paymentToRecordDetails.from} to ${paymentToRecordDetails.to} has been recorded.` });
      onAction();
      setPaymentToRecordDetails(null);
      setRecordPaymentNotes('');
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast({ title: "Error Recording Payment", description: error.message || "Could not record payment. Check console for details.", variant: "destructive" });
    } finally {
      setIsRecordingPayment(false);
    }
  };


  if (!expenses || !members) {
    return (
      <Card className="text-center py-10 shadow-sm border-dashed">
        <CardContent>
          <Scale className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-semibold">Loading data or no expenses/members yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Add expenses and members to see settlement details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Member Financial Summary</CardTitle>
          <CardDescription>Breakdown of each member's contributions, shares, and net balance after recorded payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {memberFinancials.length > 0 ? (
            <ul className="divide-y">
              {memberFinancials.map(({ memberId, memberName, totalPaid, totalShare, netBalance }) => (
                <li key={memberId} className="py-4">
                  <div className="font-semibold text-lg mb-2">{memberName}</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span>{displayCurrencySymbol}{totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Share:</span>
                      <span>{displayCurrencySymbol}{totalShare.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between font-semibold pt-1 mt-1 border-t border-dashed ${netBalance < -0.005 ? 'text-destructive' : netBalance > 0.005 ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                      <span>Net Balance:</span>
                      <span>
                        {netBalance < -0.005 ? <>Owes {displayCurrencySymbol}{Math.abs(netBalance).toFixed(2)}</> : (netBalance > 0.005 ? <>Is Owed {displayCurrencySymbol}{netBalance.toFixed(2)}</> : <>Settled {displayCurrencySymbol}0.00</>)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No financial information available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Settlement Plan (Outstanding Debts)</CardTitle>
          <CardDescription>Suggested transactions to settle remaining debts. Click the checkmark to record a payment having been made.</CardDescription>
        </CardHeader>
        <CardContent>
          {settlementTransactions.length > 0 ? (
            <ul className="space-y-3">
              {settlementTransactions.map((txn, index) => (
                <li key={index} className="p-4 border rounded-lg shadow-sm bg-background hover:bg-muted/50 transition-colors flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-grow">
                    <span className="font-semibold text-primary text-sm break-all">{txn.from}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold text-primary text-sm break-all">{txn.to}</span>
                  </div>
                  <strong className="text-base sm:text-lg font-semibold whitespace-nowrap">{displayCurrencySymbol}{txn.amount.toFixed(2)}</strong>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPaymentToRecordDetails(txn)}
                    className="ml-2 flex-shrink-0"
                    aria-label={`Record payment from ${txn.from} to ${txn.to}`}
                  >
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {expenses && expenses.length > 0 && members && members.length > 0
                ? "All outstanding debts are settled, or no transactions needed!"
                : "Add expenses and members to calculate settlement."
              }
            </p>
          )}
        </CardContent>
      </Card>

      {paymentToRecordDetails && (
        <AlertDialog open={!!paymentToRecordDetails} onOpenChange={(open) => { if (!open) { setPaymentToRecordDetails(null); setRecordPaymentNotes(''); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Record Payment</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to record a payment of <strong className="mx-1">{displayCurrencySymbol}{paymentToRecordDetails.amount.toFixed(2)}</strong>
                from <strong className="mx-1">{paymentToRecordDetails.from}</strong>
                to <strong className="mx-1">{paymentToRecordDetails.to}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Textarea
                placeholder="Optional notes about this payment (e.g., paid via UPI, cash)"
                value={recordPaymentNotes}
                onChange={(e) => setRecordPaymentNotes(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setPaymentToRecordDetails(null); setRecordPaymentNotes(''); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRecordPayment} disabled={isRecordingPayment}>
                {isRecordingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Record Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
