import axios from 'axios';
import type {
  Cabinet,
  CabinetDetail,
  BorrowRecord,
  Stats,
  CreateBorrowRequest,
  ReturnBookRequest,
  CleanupRequest,
} from '../types';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  getStats: (): Promise<Stats> => api.get('/stats').then(r => r.data),
  getCabinets: (): Promise<Cabinet[]> => api.get('/cabinets').then(r => r.data),
  getCabinet: (id: number): Promise<CabinetDetail> => api.get(`/cabinets/${id}`).then(r => r.data),
  getCabinetRecords: (id: number): Promise<BorrowRecord[]> => api.get(`/cabinets/${id}/records`).then(r => r.data),
  createBorrow: (data: CreateBorrowRequest): Promise<BorrowRecord> => api.post('/borrow', data).then(r => r.data),
  returnBook: (id: number, data: ReturnBookRequest): Promise<BorrowRecord> => api.post(`/return/${id}`, data).then(r => r.data),
  cleanupCabinet: (id: number, data: CleanupRequest): Promise<Cabinet> => api.post(`/cleanup/${id}`, data).then(r => r.data),
  getOverdue: (): Promise<BorrowRecord[]> => api.get('/overdue').then(r => r.data),
  getPendingCleanup: (): Promise<Cabinet[]> => api.get('/pending-cleanup').then(r => r.data),
};

export default api;
