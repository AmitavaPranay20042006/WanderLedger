
'use client';

import React, { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ListChecks, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PackingListItem } from '@/lib/types/trip';

interface PackingListTabProps {
  tripId: string;
  initialPackingItems: PackingListItem[] | undefined; // Renamed to match original
  onPackingAction: () => void;
  currentUser: FirebaseUser | null;
}

export default function PackingListTab({ tripId, initialPackingItems, onPackingAction, currentUser }: PackingListTabProps) {
  const [newItemName, setNewItemName] = useState<string>('');
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const { toast } = useToast();

  const packingItems = initialPackingItems || [];
  const totalItems: number = packingItems.length;
  const packedItemsCount: number = packingItems.filter(item => item.packed).length;
  const progress: number = totalItems > 0 ? (packedItemsCount / totalItems) * 100 : 0;

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast({ title: "Item name cannot be empty", variant: "destructive", description: "Please enter a name for the packing item." });
      return;
    }
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to add items.", variant: "destructive" });
      return;
    }
    setIsAddingItem(true);
    try {
      const itemToAdd = {
        name: newItemName.trim(),
        packed: false,
        addedBy: currentUser.uid,
        createdAt: FirestoreTimestamp.now(), // Use FirestoreTimestamp for server
      };
      await addDoc(collection(db, 'trips', tripId, 'packingItems'), itemToAdd);

      toast({ title: "Item Added", description: `"${itemToAdd.name}" has been added to your packing list.` });
      setNewItemName('');
      onPackingAction();
    } catch (error: any) {
      console.error("Error adding packing item:", error);
      toast({
        title: "Error Adding Item",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleTogglePacked = async (item: PackingListItem) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to update items.", variant: "destructive" });
      return;
    }
    const itemRef = doc(db, 'trips', tripId, 'packingItems', item.id);
    try {
      await updateDoc(itemRef, {
        packed: !item.packed,
        lastCheckedBy: currentUser.uid,
      });
      onPackingAction();
    } catch (error: any) {
      console.error("Error updating packing item:", error);
      toast({
        title: "Error Updating Item",
        description: error.message || "Could not update item status.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Packing List ({packedItemsCount}/{totalItems} packed)</h2>
      </div>
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="flex gap-2 mb-6">
            <Input
              placeholder="Add new packing item (e.g., Passport, Sunscreen)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              disabled={isAddingItem}
              className="flex-grow"
              aria-label="New packing item name"
            />
            <Button type="submit" disabled={isAddingItem || !newItemName.trim()} className="flex-shrink-0 shadow-sm hover:shadow-md transition-shadow">
              {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              <span className="hidden sm:inline ml-2">Add Item</span>
            </Button>
          </form>

          {totalItems > 0 && (
            <div className="mb-6">
              <Progress value={progress} aria-label={`Packing progress: ${packedItemsCount} of ${totalItems} items packed`} className="h-2.5" />
              <p className="text-xs text-muted-foreground text-right mt-1">{packedItemsCount} / {totalItems} items packed ({Math.round(progress)}%)</p>
            </div>
          )}

          {packingItems && packingItems.length > 0 ? (
            <ul className="divide-y max-h-96 overflow-y-auto border rounded-md">
              {packingItems.map(item => (
                <li key={item.id} className="py-3 px-4 flex justify-between items-center hover:bg-muted/50 group">
                  <label htmlFor={`item-${item.id}`} className="flex items-center cursor-pointer flex-grow gap-3">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.packed}
                      onCheckedChange={() => handleTogglePacked(item)}
                      aria-label={`Mark ${item.name} as ${item.packed ? 'unpacked' : 'packed'}`}
                    />
                    <span className={`${item.packed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 border border-dashed rounded-md">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-semibold">Your packing list is empty.</p>
              <p className="text-sm text-muted-foreground mt-1">Add items you need for the trip!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
