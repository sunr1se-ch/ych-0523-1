import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, X, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import { useGlobalDrafts } from '../hooks/useGlobalDrafts';
import { validateBorrowDraft, validateReturnDraft } from '../hooks/useDraft';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/format';
import { cn } from '../lib/utils';
import type { Draft, BorrowDraft, ReturnDraft, DraftSource } from '../types';

const sourceLabels: Record<DraftSource, string> = {
  overview: '总览页',
  'cabinet-detail': '柜格详情',
  overdue: '逾期页',
};

export default function DraftNotice() {
  const navigate = useNavigate();
  const { drafts, clearSpecificDraft, clearAllDrafts } = useGlobalDrafts();
  const { cabinets, activeRecords } = useAppStore();
  const [showPanel, setShowPanel] = useState(false);

  if (drafts.length === 0) return null;

  const getDraftDescription = (draft: Draft): string => {
    if (draft.type === 'borrow') {
      return draft.bookTitle || draft.residentName || '借书登记';
    }
    const record = activeRecords.find(r => r.id === draft.recordId);
    return record ? `${record.residentName} - ${record.bookTitle}` : '还书登记';
  };

  const getDraftCabinet = (draft: Draft): string => {
    const cabinetId = draft.type === 'borrow' ? draft.cabinetId : draft.sourceCabinetId;
    if (!cabinetId) return '-';
    const cabinet = cabinets.find(c => c.id === cabinetId);
    return cabinet?.code || '-';
  };

  const handleRestore = (draft: Draft) => {
    let validation: { valid: boolean; reason?: string } = { valid: true };
    
    if (draft.type === 'borrow') {
      validation = validateBorrowDraft(draft as BorrowDraft, cabinets);
    } else {
      validation = validateReturnDraft(draft as ReturnDraft, activeRecords);
    }

    if (!validation.valid) {
      clearSpecificDraft(draft);
      alert(validation.reason || '草稿已失效，已自动清除');
      return;
    }

    setShowPanel(false);

    if (draft.source === 'cabinet-detail' && draft.sourceCabinetId) {
      navigate(`/cabinet/${draft.sourceCabinetId}`, {
        state: { restoreDraft: draft },
      });
    } else if (draft.source === 'overdue') {
      navigate('/overdue', {
        state: { restoreDraft: draft },
      });
    } else {
      navigate('/', {
        state: { restoreDraft: draft },
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative flex items-center gap-2 px-3 py-2 bg-[#FFF8E6] border border-[#E8D5A3] rounded-lg hover:bg-[#FFF1CC] transition-colors"
      >
        <FileText className="w-4 h-4 text-[#B8860B]" />
        <span className="text-sm font-medium text-[#8B6914] hidden sm:inline">
          未完成登记
        </span>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E07B39] text-white text-xs font-bold rounded-full flex items-center justify-center">
          {drafts.length}
        </span>
      </button>

      {showPanel && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setShowPanel(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-[#E5DFD3] z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#FFF8E6] border-b border-[#E8D5A3]">
              <h3 className="font-semibold text-[#8B6914] flex items-center gap-2">
                <FileText className="w-4 h-4" />
                未完成的登记
              </h3>
              <button
                onClick={() => {
                  clearAllDrafts();
                  setShowPanel(false);
                }}
                className="text-xs text-[#B8860B] hover:text-[#5C4A0A] flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                清空全部
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {drafts.map((draft, index) => (
                <div
                  key={`${draft.type}-${draft.savedAt}-${index}`}
                  className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            draft.type === 'borrow'
                              ? 'bg-[#E8F2E6] text-[#2D5A27]'
                              : 'bg-[#E6EEF7] text-[#1E4A7E]'
                          )}
                        >
                          {draft.type === 'borrow' ? '借书' : '还书'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {sourceLabels[draft.source]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#2C2C2C] mt-1 truncate">
                        {getDraftDescription(draft)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>柜格: {getDraftCabinet(draft)}</span>
                        <span>{formatDate(draft.savedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestore(draft)}
                        className="p-1.5 text-[#2D5A27] hover:bg-[#E8F2E6] rounded transition-colors"
                        title="恢复草稿"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => clearSpecificDraft(draft)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="删除草稿"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>恢复时将检查当前状态，柜格已满或待清柜、记录已归还等情况会拦截并提示原因</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
