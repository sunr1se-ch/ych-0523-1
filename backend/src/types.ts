import type { CabinetStatus } from '@prisma/client';

export type WearLevel = 1 | 2 | 3 | 4 | 5;

export interface BorrowRecordWithOverdue {
  id: number;
  cabinetId: number;
  residentName: string;
  bookTitle: string;
  borrowDate: Date;
  expectedReturnDate: Date;
  actualReturnDate: Date | null;
  wearLevel: WearLevel | null;
  isOverdue: boolean;
  overdueDays: number;
  createdAt: Date;
}

export interface CabinetWithStats {
  id: number;
  code: string;
  capacity: number;
  currentCount: number;
  status: CabinetStatus;
  createdAt: Date;
}

export interface CreateBorrowRequest {
  cabinetId: number;
  residentName: string;
  bookTitle: string;
  borrowDate: string;
  expectedReturnDate: string;
}

export interface ReturnBookRequest {
  actualReturnDate: string;
  wearLevel: WearLevel;
}

export interface CleanupRequest {
  reason: string;
  operator: string;
}
