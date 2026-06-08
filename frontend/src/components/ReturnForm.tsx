import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../utils/api';
import { getTodayDateString } from '../utils/format';
import { validateReturnDraft } from '../hooks/useDraft';
import { FileText, AlertCircle } from 'lucide-react';
import type {
  BorrowRecord,
  WearLevel,
  ReturnDraft,
  DraftSource,
  DraftValidationResult,
} from '../types';
import { wearLevelLabels } from '../types';

interface ReturnFormProps {
  records: BorrowRecord[];
  preselectedRecordId?: number;
  onSuccess: () => void;
  onClose: () => void;
  draft?: ReturnDraft | null;
  onSaveDraft?: (data: {
    recordId: number | '';
    actualReturnDate: string;
    wearLevel: WearLevel;
  }) => void;
  onClearDraft?: () => void;
  source: DraftSource;
  sourceCabinetId?: number;
}

export default function ReturnForm({
  records,
  preselectedRecordId,
  onSuccess,
  onClose,
  draft,
  onSaveDraft,
  onClearDraft,
  source,
  sourceCabinetId,
}: ReturnFormProps) {
  const [recordId, setRecordId] = useState<number | ''>(
    draft ? draft.recordId : preselectedRecordId || ''
  );
  const [actualReturnDate, setActualReturnDate] = useState(
    draft?.actualReturnDate || getTodayDateString()
  );
  const [wearLevel, setWearLevel] = useState<WearLevel>(draft?.wearLevel || 2);
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<DraftValidationResult | null>(null);
  const setError = useAppStore(s => s.setError);

  const activeRecords = records.filter(r => !r.actualReturnDate);

  const currentDraftData = {
    recordId,
    actualReturnDate,
    wearLevel,
  };

  const saveCurrentDraft = useCallback(() => {
    if (onSaveDraft) {
      onSaveDraft({
        recordId,
        actualReturnDate,
        wearLevel,
      });
    }
  }, [onSaveDraft, recordId, actualReturnDate, wearLevel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveCurrentDraft();
    }, 500);
    return () => clearTimeout(timer);
  }, [recordId, actualReturnDate, wearLevel, saveCurrentDraft]);

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
    if (!recordId || !actualReturnDate || !wearLevel) {
      setError('请填写所有必填字段');
      return;
    }

    const draftToValidate: ReturnDraft = {
      type: 'return',
      recordId: Number(recordId),
      actualReturnDate,
      wearLevel,
      source,
      sourceCabinetId,
      savedAt: new Date().toISOString(),
    };

    const validation = validateReturnDraft(draftToValidate, records);
    if (!validation.valid) {
      setValidationResult(validation);
      setError(validation.reason || '校验失败');
      return;
    }
    setValidationResult(null);

    setSubmitting(true);
    try {
      await apiService.returnBook(Number(recordId), {
        actualReturnDate,
        wearLevel,
      });
      if (onClearDraft) {
        onClearDraft();
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '还书登记失败');
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
            <p className="text-sm font-medium text-[#8B6914]">已检测到未完成的还书登记草稿</p>
            <p className="text-xs text-[#A07D1C] mt-0.5">
              已自动恢复上次填写的内容，关闭弹窗时会自动保存
            </p>
          </div>
          {onClearDraft && (
            <button
              type="button"
              onClick={() => {
                setRecordId(preselectedRecordId || '');
                setActualReturnDate(getTodayDateString());
                setWearLevel(2);
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
        <label className="block text-sm font-medium text-gray-700 mb-1">选择借阅记录</label>
        <select
          value={recordId}
          onChange={e => setRecordId(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
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
          {submitting ? '提交中...' : '确认还书'}
        </button>
      </div>
    </form>
  );
}
