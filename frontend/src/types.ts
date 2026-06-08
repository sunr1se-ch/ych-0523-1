export type CabinetStatus = 'available' | 'partial' | 'full' | 'pending_cleanup';
export type WearLevel = 1 | 2 | 3 | 4 | 5;

export interface Cabinet {
  id: number;
  code: string;
  capacity: number;
  currentCount: number;
  status: CabinetStatus;
  createdAt: string;
}

export interface CabinetDetail extends Cabinet {
  records: BorrowRecord[];
}

export interface BorrowRecord {
  id: number;
  cabinetId: number;
  residentName: string;
  bookTitle: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  wearLevel: WearLevel | null;
  isOverdue: boolean;
  overdueDays: number;
  createdAt: string;
}

export interface Stats {
  total: number;
  available: number;
  borrowed: number;
  pendingCleanup: number;
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

export const statusLabels: Record<CabinetStatus, string> = {
  available: '空位',
  partial: '在借',
  full: '已满',
  pending_cleanup: '待清柜',
};

export const wearLevelLabels: Record<WearLevel, string> = {
  1: '崭新，无磨损',
  2: '轻微磨损，书脊完整',
  3: '中度磨损，有折痕但不影响阅读',
  4: '严重磨损，书脊有开裂',
  5: '损坏严重，需下架维修',
};

export type DraftType = 'borrow' | 'return';

export type DraftSource = 'overview' | 'cabinet-detail' | 'overdue';

export interface BorrowDraft {
  type: 'borrow';
  cabinetId: number;
  residentName: string;
  bookTitle: string;
  borrowDate: string;
  expectedReturnDate: string;
  source: DraftSource;
  sourceCabinetId?: number;
  savedAt: string;
}

export interface ReturnDraft {
  type: 'return';
  recordId: number;
  actualReturnDate: string;
  wearLevel: WearLevel;
  source: DraftSource;
  sourceCabinetId?: number;
  savedAt: string;
}

export type Draft = BorrowDraft | ReturnDraft;

export interface DraftValidationResult {
  valid: boolean;
  reason?: string;
}

export interface ExpiringSoonInfo {
  daysUntilDue: number;
  isExpiringSoon: boolean;
}
