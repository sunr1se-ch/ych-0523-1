import { create } from 'zustand';
import type { Cabinet, CabinetDetail, BorrowRecord, Stats } from '../types';
import { apiService } from '../utils/api';

interface AppState {
  stats: Stats | null;
  cabinets: Cabinet[];
  currentCabinet: CabinetDetail | null;
  activeRecords: BorrowRecord[];
  overdueRecords: BorrowRecord[];
  pendingCleanup: Cabinet[];
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  fetchCabinets: () => Promise<void>;
  fetchCabinet: (id: number) => Promise<void>;
  fetchActiveRecords: () => Promise<void>;
  fetchOverdue: () => Promise<void>;
  fetchPendingCleanup: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  stats: null,
  cabinets: [],
  currentCabinet: null,
  activeRecords: [],
  overdueRecords: [],
  pendingCleanup: [],
  loading: false,
  error: null,

  fetchStats: async () => {
    try {
      const stats = await apiService.getStats();
      set({ stats });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取统计数据失败' });
    }
  },

  fetchCabinets: async () => {
    set({ loading: true });
    try {
      const cabinets = await apiService.getCabinets();
      set({ cabinets });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取柜格列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCabinet: async (id: number) => {
    set({ loading: true });
    try {
      const cabinet = await apiService.getCabinet(id);
      set({ currentCabinet: cabinet });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取柜格详情失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchActiveRecords: async () => {
    set({ loading: true });
    try {
      const records = await apiService.getActiveRecords();
      set({ activeRecords: records });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取借阅记录失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchOverdue: async () => {
    set({ loading: true });
    try {
      const records = await apiService.getOverdue();
      set({ overdueRecords: records });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取逾期列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchPendingCleanup: async () => {
    set({ loading: true });
    try {
      const cabinets = await apiService.getPendingCleanup();
      set({ pendingCleanup: cabinets });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取待清柜列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  refreshAll: async () => {
    const { fetchStats, fetchCabinets, fetchActiveRecords, fetchOverdue, fetchPendingCleanup } = get();
    await Promise.all([
      fetchStats(),
      fetchCabinets(),
      fetchActiveRecords(),
      fetchOverdue(),
      fetchPendingCleanup(),
    ]);
  },

  setError: (error: string | null) => set({ error }),
}));
