import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../utils/api';
import { getTodayDateString } from '../utils/format';
import type { BorrowRecord, WearLevel } from '../types';
import { wearLevelLabels } from '../types';

interface ReturnFormProps {
  records: BorrowRecord[];
  preselectedRecordId?: number;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ReturnForm({ records, preselectedRecordId, onSuccess, onClose }: ReturnFormProps) {
  const [recordId, setRecordId] = useState<number | ''>(preselectedRecordId || '');
  const [actualReturnDate, setActualReturnDate] = useState(getTodayDateString());
  const [wearLevel, setWearLevel] = useState<WearLevel>(2);
  const [submitting, setSubmitting] = useState(false);
  const setError = useAppStore(s => s.setError);

  const activeRecords = records.filter(r => !r.actualReturnDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordId || !actualReturnDate || !wearLevel) {
      setError('请填写所有必填字段');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.returnBook(Number(recordId), {
        actualReturnDate,
        wearLevel,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '还书登记失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">选择借阅记录</label>
        <select
          value={recordId}
          onChange={e => setRecordId(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          disabled={!!preselectedRecordId}
        >
          <option value="">请选择借阅记录</option>
          {activeRecords.map(r => (
            <option key={r.id} value={r.id}>
              {r.residentName} - {r.bookTitle}
              {r.isOverdue && ` (逾期${r.overdueDays}天)`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">实际归还日</label>
        <input
          type="date"
          value={actualReturnDate}
          onChange={e => setActualReturnDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">书脊磨损等级</label>
        <div className="grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as WearLevel[]).map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setWearLevel(level)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                wearLevel === level
                  ? 'bg-[#2D5A27] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={wearLevelLabels[level]}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {wearLevelLabels[wearLevel]}
        </p>
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
          {submitting ? '提交中...' : '确认还书'}
        </button>
      </div>
    </form>
  );
}
