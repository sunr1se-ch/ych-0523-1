import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../utils/api';
import type { Cabinet } from '../types';

interface CleanupFormProps {
  cabinet: Cabinet;
  onSuccess: () => void;
  onClose: () => void;
}

export default function CleanupForm({ cabinet, onSuccess, onClose }: CleanupFormProps) {
  const [reason, setReason] = useState('逾期图书已处理，柜格已清点');
  const [operator, setOperator] = useState('管理员');
  const [submitting, setSubmitting] = useState(false);
  const setError = useAppStore(s => s.setError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !operator) {
      setError('请填写所有必填字段');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.cleanupCabinet(cabinet.id, { reason, operator });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '清柜确认失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-[#FCEFE6] border border-[#F5C9A8] rounded-lg p-4">
        <p className="text-[#E07B39] text-sm">
          <span className="font-semibold">柜格 {cabinet.code}</span> 将从「待清柜」状态恢复为可用状态。
          清柜完成后，该柜格可重新接受借书登记。
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">清柜原因</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          rows={3}
          placeholder="请输入清柜原因"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">操作员</label>
        <input
          type="text"
          value={operator}
          onChange={e => setOperator(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          placeholder="请输入操作员姓名"
        />
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
          className="flex-1 px-4 py-2 bg-[#E07B39] text-white rounded-lg hover:bg-[#C96A2E] transition-colors disabled:opacity-50"
        >
          {submitting ? '提交中...' : '确认清柜'}
        </button>
      </div>
    </form>
  );
}
