import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type {
  Draft,
  BorrowDraft,
  ReturnDraft,
  DraftValidationResult,
  DraftSource,
  Cabinet,
  BorrowRecord,
  CreateBorrowRequest,
  ReturnBookRequest,
} from '../types';
import { getTodayDateString } from '../utils/format';

const DRAFT_STORAGE_KEY = 'book_cabinet_drafts';

function readDrafts(): Draft[] {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts: Draft[]): void {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

function isDraftEmpty(draft: Draft): boolean {
  if (draft.type === 'borrow') {
    return (
      !draft.residentName.trim() &&
      !draft.bookTitle.trim() &&
      draft.borrowDate === getTodayDateString()
    );
  }
  return false;
}

export function validateBorrowDraft(
  draft: BorrowDraft,
  cabinets: Cabinet[]
): DraftValidationResult {
  const cabinet = cabinets.find(c => c.id === draft.cabinetId);
  if (!cabinet) {
    return { valid: false, reason: '所选柜格不存在，可能已被删除' };
  }
  if (cabinet.status === 'pending_cleanup') {
    return { valid: false, reason: `柜格 ${cabinet.code} 处于待清柜状态，无法借书` };
  }
  if (cabinet.currentCount >= cabinet.capacity) {
    return { valid: false, reason: `柜格 ${cabinet.code} 已满，无法借书` };
  }
  return { valid: true };
}

export function validateReturnDraft(
  draft: ReturnDraft,
  records: BorrowRecord[]
): DraftValidationResult {
  const record = records.find(r => r.id === draft.recordId);
  if (!record) {
    return { valid: false, reason: '所选借阅记录不存在' };
  }
  if (record.actualReturnDate) {
    return { valid: false, reason: `《${record.bookTitle}》已归还，无需重复操作` };
  }
  return { valid: true };
}

export function getDaysUntilDue(expectedReturnDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(expectedReturnDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(record: BorrowRecord): boolean {
  if (record.actualReturnDate || record.isOverdue) return false;
  const days = getDaysUntilDue(record.expectedReturnDate);
  return days >= 0 && days <= 3;
}

export function getExpiringRecords(records: BorrowRecord[]): BorrowRecord[] {
  return records.filter(r => isExpiringSoon(r));
}

interface UseDraftOptions {
  source: DraftSource;
  sourceCabinetId?: number;
  cabinets: Cabinet[];
  records: BorrowRecord[];
}

export function useDraft({ source, sourceCabinetId, cabinets, records }: UseDraftOptions) {
  const location = useLocation();
  const [drafts, setDrafts] = useState<Draft[]>(() => readDrafts());

  const refreshDrafts = useCallback(() => {
    setDrafts(readDrafts());
  }, []);

  useEffect(() => {
    const handleStorage = () => refreshDrafts();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshDrafts]);

  const saveBorrowDraft = useCallback(
    (data: Omit<CreateBorrowRequest, 'cabinetId'> & { cabinetId: number | '' }) => {
      if (data.cabinetId === '' || isDraftEmpty({
        type: 'borrow',
        cabinetId: Number(data.cabinetId),
        residentName: data.residentName,
        bookTitle: data.bookTitle,
        borrowDate: data.borrowDate,
        expectedReturnDate: data.expectedReturnDate,
        source,
        sourceCabinetId,
        savedAt: new Date().toISOString(),
      })) {
        return;
      }

      const allDrafts = readDrafts();
      const newDraft: BorrowDraft = {
        type: 'borrow',
        cabinetId: Number(data.cabinetId),
        residentName: data.residentName,
        bookTitle: data.bookTitle,
        borrowDate: data.borrowDate,
        expectedReturnDate: data.expectedReturnDate,
        source,
        sourceCabinetId,
        savedAt: new Date().toISOString(),
      };

      const filtered = allDrafts.filter(
        d => !(d.type === 'borrow' && d.source === source && d.sourceCabinetId === sourceCabinetId)
      );
      filtered.push(newDraft);
      writeDrafts(filtered);
      setDrafts(filtered);
    },
    [source, sourceCabinetId]
  );

  const saveReturnDraft = useCallback(
    (data: ReturnBookRequest & { recordId: number | '' }) => {
      if (data.recordId === '') return;

      const allDrafts = readDrafts();
      const newDraft: ReturnDraft = {
        type: 'return',
        recordId: Number(data.recordId),
        actualReturnDate: data.actualReturnDate,
        wearLevel: data.wearLevel,
        source,
        sourceCabinetId,
        savedAt: new Date().toISOString(),
      };

      const filtered = allDrafts.filter(
        d => !(d.type === 'return' && d.source === source && d.sourceCabinetId === sourceCabinetId)
      );
      filtered.push(newDraft);
      writeDrafts(filtered);
      setDrafts(filtered);
    },
    [source, sourceCabinetId]
  );

  const clearDraft = useCallback(
    (type: 'borrow' | 'return') => {
      const allDrafts = readDrafts();
      const filtered = allDrafts.filter(
        d => !(d.type === type && d.source === source && d.sourceCabinetId === sourceCabinetId)
      );
      writeDrafts(filtered);
      setDrafts(filtered);
    },
    [source, sourceCabinetId]
  );

  const clearAllDrafts = useCallback(() => {
    writeDrafts([]);
    setDrafts([]);
  }, []);

  const clearSpecificDraft = useCallback((draft: Draft) => {
    const allDrafts = readDrafts();
    const filtered = allDrafts.filter(
      d => !(d.type === draft.type && d.savedAt === draft.savedAt && d.source === draft.source)
    );
    writeDrafts(filtered);
    setDrafts(filtered);
  }, []);

  const getBorrowDraft = useCallback((): BorrowDraft | null => {
    return (
      (drafts.find(
        d => d.type === 'borrow' && d.source === source && d.sourceCabinetId === sourceCabinetId
      ) as BorrowDraft) || null
    );
  }, [drafts, source, sourceCabinetId]);

  const getReturnDraft = useCallback((): ReturnDraft | null => {
    return (
      (drafts.find(
        d => d.type === 'return' && d.source === source && d.sourceCabinetId === sourceCabinetId
      ) as ReturnDraft) || null
    );
  }, [drafts, source, sourceCabinetId]);

  const validateCurrentBorrowDraft = useCallback((): DraftValidationResult => {
    const draft = getBorrowDraft();
    if (!draft) return { valid: true };
    return validateBorrowDraft(draft, cabinets);
  }, [getBorrowDraft, cabinets]);

  const validateCurrentReturnDraft = useCallback((): DraftValidationResult => {
    const draft = getReturnDraft();
    if (!draft) return { valid: true };
    return validateReturnDraft(draft, records);
  }, [getReturnDraft, records]);

  const getAllDrafts = useCallback((): Draft[] => {
    return drafts;
  }, [drafts]);

  const hasAnyDraft = useCallback((): boolean => {
    return drafts.length > 0;
  }, [drafts]);

  const getDraftCount = useCallback((): number => {
    return drafts.length;
  }, [drafts]);

  useEffect(() => {
    refreshDrafts();
  }, [location.pathname, refreshDrafts]);

  return {
    drafts,
    saveBorrowDraft,
    saveReturnDraft,
    clearDraft,
    clearAllDrafts,
    clearSpecificDraft,
    getBorrowDraft,
    getReturnDraft,
    validateCurrentBorrowDraft,
    validateCurrentReturnDraft,
    getAllDrafts,
    hasAnyDraft,
    getDraftCount,
    refreshDrafts,
  };
}
