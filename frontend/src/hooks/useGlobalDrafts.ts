import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { Draft, BorrowDraft, ReturnDraft } from '../types';

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

export function useGlobalDrafts() {
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

  useEffect(() => {
    refreshDrafts();
  }, [location.pathname, refreshDrafts]);

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

  const clearBorrowDraft = useCallback((source: string, sourceCabinetId?: number) => {
    const allDrafts = readDrafts();
    const filtered = allDrafts.filter(
      d => !(d.type === 'borrow' && d.source === source && d.sourceCabinetId === sourceCabinetId)
    );
    writeDrafts(filtered);
    setDrafts(filtered);
  }, []);

  const clearReturnDraft = useCallback((source: string, sourceCabinetId?: number) => {
    const allDrafts = readDrafts();
    const filtered = allDrafts.filter(
      d => !(d.type === 'return' && d.source === source && d.sourceCabinetId === sourceCabinetId)
    );
    writeDrafts(filtered);
    setDrafts(filtered);
  }, []);

  const getDraftCount = useCallback((): number => {
    return drafts.length;
  }, [drafts]);

  const hasAnyDraft = useCallback((): boolean => {
    return drafts.length > 0;
  }, [drafts]);

  const getBorrowDrafts = useCallback((): BorrowDraft[] => {
    return drafts.filter(d => d.type === 'borrow') as BorrowDraft[];
  }, [drafts]);

  const getReturnDrafts = useCallback((): ReturnDraft[] => {
    return drafts.filter(d => d.type === 'return') as ReturnDraft[];
  }, [drafts]);

  const getAllDrafts = useCallback((): Draft[] => {
    return drafts;
  }, [drafts]);

  return {
    drafts,
    refreshDrafts,
    clearAllDrafts,
    clearSpecificDraft,
    clearBorrowDraft,
    clearReturnDraft,
    getDraftCount,
    hasAnyDraft,
    getBorrowDrafts,
    getReturnDrafts,
    getAllDrafts,
  };
}
