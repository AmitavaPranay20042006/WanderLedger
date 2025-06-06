
import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  description: string;
  coverPhotoURL: string;
  dataAiHint: string;
  ownerId: string;
  members: string[];
  totalExpenses?: number;
  baseCurrency?: string;
  createdAt?: Date | FirestoreTimestamp;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  paidByName?: string;
  date: Date;
  category: string;
  participants: string[];
  splitType: 'equally' | 'unequally' | 'percentage';
  notes?: string;
  createdAt?: Date | FirestoreTimestamp;
}

export interface ItineraryEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: string;
  location?: string;
  notes?: string;
  endDate?: Date;
  attachments?: string[];
  createdAt?: Date | FirestoreTimestamp;
}

export interface PackingListItem {
  id: string;
  name: string;
  packed: boolean;
  assignee?: string;
  assigneeName?: string;
  addedBy?: string;
  lastCheckedBy?: string;
  createdAt?: Date | FirestoreTimestamp;
}

export interface Member {
  id: string; // UID
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
}

export interface MemberFinancials {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
  initialNetBalance: number;
}

export interface RecordedPayment {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  dateRecorded: Date | FirestoreTimestamp;
  recordedBy: string;
  notes?: string;
}

export interface SettlementTransaction {
  fromUserId: string;
  from: string; // Payer name
  toUserId: string;
  to: string;   // Receiver name
  amount: number;
}
