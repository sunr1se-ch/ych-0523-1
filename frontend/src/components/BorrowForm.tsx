import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../utils/api';
import { getTodayDateString, getDateString } from '../utils/format';
import type { Cabinet } from '../types';

interface BorrowFormProps {
  cabinets: Cabinet[];
  preselectedCabinetId?: number;
  onSuccess: () => void;
  onClose: () => void;
}

export default function BorrowForm({ cabinets, preselectedCabinetId, onSuccess, onClose }: BorrowFormProps) {
  const [cabinetId, setCabinetId] = useState<number | ''>(preselectedCabinetId || '');
  const [residentName, setResidentName] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [borrowDate, setBorrowDate] = useState(getTodayDateString());
  const [expectedReturnDate, setExpectedReturnDate] = useState(getDateString(14));
  const [submitting, setSubmitting] = useState(false);
  const setError = useAppStore(s => s.setError);

  const availableCabinets = cabinets.filter(c =>
    c.status !== 'pending_cleanup' && c.currentCount < c.capacity
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabinetId || !residentName || !bookTitle || !borrowDate || !expectedReturnDate) {
      setError('请填写所有必填字段');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createBorrow({
        cabinetId: Number(cabinetId),
        residentName,
        bookTitle,
        borrowDate,
        expectedReturnDate,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '借书登记失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">柜格编号</label>
        <select
          value={cabinetId}
          onChange={e => setCabinetId(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          disabled={!!preselectedCabinetId}
        >
          <option value="">请选择柜格</option>
          {availableCabinets.map(c => (
            <option key={c.id} value={c.id}>
              {c.code} ({c.currentCount}/{c.capacity})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">居民姓名</label>
        <input
          type="text"
          value={residentName}
          onChange={e => setResidentName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          placeholder="请输入居民姓名"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">书名</label>
        <input
          type="text"
          value={bookTitle}
          onChange={e => setBookTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          placeholder="请输入书名"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">取走日期</label>
          <input
            type="date"
            value={borrowDate}
            onChange={e => setBorrowDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">预计归还日</label>
          <input
            type="date"
            value={expectedReturnDate}
            onChange={e => setExpectedReturnDate(e.target.value)}
            min={borrowDate}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#234A1F] transition-colors disabled:opacity-50"
        >
          {submitting ? '提交中...' : '确认登记'}
        </button>
      </div>
    </form>
  );
}
