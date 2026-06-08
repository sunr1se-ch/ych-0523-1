import type { BorrowRecord } from '@prisma/client';
import type { BorrowRecordWithOverdue } from '../types';
import { calculateOverdueDays, isOverdue } from './dateUtils';

export function transformBorrowRecord(record: BorrowRecord): BorrowRecordWithOverdue {
  return {
    id: record.id,
    cabinetId: record.cabinetId,
    residentName: record.residentName,
    bookTitle: record.bookTitle,
    borrowDate: record.borrowDate,
    expectedReturnDate: record.expectedReturnDate,
    actualReturnDate: record.actualReturnDate,
    wearLevel: record.wearLevel as BorrowRecordWithOverdue['wearLevel'],
    isOverdue: isOverdue(record.expectedReturnDate, record.actualReturnDate),
    overdueDays: calculateOverdueDays(record.expectedReturnDate, record.actualReturnDate),
    createdAt: record.createdAt,
  };
}
