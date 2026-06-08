import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../utils/api';
import { getTodayDateString, getDateString } from '../utils/format';
import { validateBorrowDraft } from '../hooks/useDraft';
import { FileText, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Cabinet, BorrowDraft, DraftSource, DraftValidationResult } from '../types';

interface BorrowFormProps {
  cabinets: Cabinet[];
  preselectedCabinetId?: number;
  onSuccess: () => void;
  onClose: () => void;
  draft?: BorrowDraft | null;
  onSaveDraft?: (data: {
    cabinetId: number | '';
    residentName: string;
    bookTitle: string;
    borrowDate: string;
    expectedReturnDate: string;
  }) => void;
  onClearDraft?: () => void;
  source: DraftSource;
  sourceCabinetId?: number;
}

export default function BorrowForm({
  cabinets,
  preselectedCabinetId,
  onSuccess,
  onClose,
  draft,
  onSaveDraft,
  onClearDraft,
  source,
  sourceCabinetId,
}: BorrowFormProps) {
  const [cabinetId, setCabinetId] = useState<number | ''>(
    draft ? draft.cabinetId : preselectedCabinetId || ''
  );
  const [residentName, setResidentName] = useState(draft?.residentName || '');
  const [bookTitle, setBookTitle] = useState(draft?.bookTitle || '');
  const [borrowDate, setBorrowDate] = useState(draft?.borrowDate || getTodayDateString());
  const [expectedReturnDate, setExpectedReturnDate] = useState(
    draft?.expectedReturnDate || getDateString(14)
  );
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<DraftValidationResult | null>(null);
  const setError = useAppStore(s => s.setError);

  const availableCabinets = cabinets.filter(c =>
    c.status !== 'pending_cleanup' && c.currentCount < c.capacity
  );

  const currentDraftData = {
    cabinetId,
    residentName,
    bookTitle,
    borrowDate,
    expectedReturnDate,
  };

  const saveCurrentDraft = useCallback(() => {
    if (onSaveDraft) {
      onSaveDraft({
        cabinetId,
        residentName,
        bookTitle,
        borrowDate,
        expectedReturnDate,
      });
    }
  }, [onSaveDraft, cabinetId, residentName, bookTitle, borrowDate, expectedReturnDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveCurrentDraft();
    }, 500);
    return () => clearTimeout(timer);
  }, [cabinetId, residentName, bookTitle, borrowDate, expectedReturnDate, saveCurrentDraft]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentDraft();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveCurrentDraft]);

  const handleCloseWithSave = () => {
    saveCurrentDraft();
    onClose();
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabinetId || !residentName || !bookTitle || !borrowDate || !expectedReturnDate) {
      setError('请填写所有必填字段');
      return;
    }

    const draftToValidate: BorrowDraft = {
      type: 'borrow',
      cabinetId: Number(cabinetId),
      residentName,
      bookTitle,
      borrowDate,
      expectedReturnDate,
      source,
      sourceCabinetId,
      savedAt: new Date().toISOString(),
    };

    const validation = validateBorrowDraft(draftToValidate, cabinets);
    if (!validation.valid) {
      setValidationResult(validation);
      setError(validation.reason || '校验失败');
      return;
    }
    setValidationResult(null);

    setSubmitting(true);
    try {
      await apiService.createBorrow({
        cabinetId: Number(cabinetId),
        residentName,
        bookTitle,
        borrowDate,
        expectedReturnDate,
      });
      if (onClearDraft) {
        onClearDraft();
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '借书登记失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={validateAndSubmit} className="space-y-4">
      {draft && (
        <div className="bg-[#FFF8E6] border border-[#E8D5A3] rounded-lg p-3 flex items-start gap-2">
          <FileText className="w-5 h-5 text-[#B8860B] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#8B6914]">已检测到未完成的借书登记草稿</p>
            <p className="text-xs text-[#A07D1C] mt-0.5">
              已自动恢复上次填写的内容，关闭弹窗时会自动保存
            </p>
          </div>
          {onClearDraft && (
            <button
              type="button"
              onClick={() => {
                setCabinetId(preselectedCabinetId || '');
                setResidentName('');
                setBookTitle('');
                setBorrowDate(getTodayDateString());
                setExpectedReturnDate(getDateString(14));
                onClearDraft();
              }}
              className="text-xs text-[#8B6914] hover:text-[#5C4A0A] underline"
            >
              清除草稿
            </button>
          )}
        </div>
      )}

      {validationResult && !validationResult.valid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{validationResult.reason}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">柜格编号</label>
        <select
          value={cabinetId}
          onChange={e => setCabinetId(Number(e.target.value))}
          className={cn(
            'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent',
            preselectedCabinetId
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300'
          )}
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
          onClick={handleCloseWithSave}
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
