import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, User, BookOpen, ArrowDownToLine } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/format';
import Modal from '../components/Modal';
import ReturnForm from '../components/ReturnForm';
import { useDraft } from '../hooks/useDraft';
import { isExpiringSoon, getDaysUntilDue } from '../hooks/useDraft';
import { cn } from '../lib/utils';
import type { Draft } from '../types';

export default function Overdue() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    overdueRecords,
    activeRecords,
    cabinets,
    fetchOverdue,
    fetchCabinets,
    fetchActiveRecords,
    refreshAll,
  } = useAppStore();
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);
  const [restoreDraft, setRestoreDraft] = useState<Draft | null>(null);

  const {
    saveReturnDraft,
    clearDraft,
    getReturnDraft,
    refreshDrafts,
  } = useDraft({
    source: 'overdue',
    cabinets,
    records: [...overdueRecords, ...activeRecords],
  });

  useEffect(() => {
    fetchOverdue();
    fetchCabinets();
    fetchActiveRecords();
  }, [fetchOverdue, fetchCabinets, fetchActiveRecords]);

  useEffect(() => {
    const state = location.state as { restoreDraft?: Draft } | null;
    if (state?.restoreDraft) {
      const draft = state.restoreDraft;
      setRestoreDraft(draft);
      if (draft.type === 'return') {
        setSelectedRecord(null);
        setTimeout(() => {
          setSelectedRecord(draft.recordId);
        }, 100);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    refreshDrafts();
  }, [selectedRecord, refreshDrafts]);

  const cabinetMap = new Map(cabinets.map(c => [c.id, c]));

  const allRecords = useMemo(() => {
    const uniqueRecords = new Map<number, typeof activeRecords[0]>();
    activeRecords.forEach(r => uniqueRecords.set(r.id, r));
    overdueRecords.forEach(r => uniqueRecords.set(r.id, r));
    return Array.from(uniqueRecords.values());
  }, [activeRecords, overdueRecords]);

  const expiringRecords = useMemo(
    () => allRecords.filter(r => isExpiringSoon(r)),
    [allRecords]
  );

  const handleSuccess = () => {
    clearDraft('return');
    setSelectedRecord(null);
    setRestoreDraft(null);
    refreshAll();
  };

  const getOverdueSeverity = (days: number) => {
    if (days > 7) return 'critical';
    if (days > 3) return 'warning';
    return 'caution';
  };

  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      text: 'text-red-600',
    },
    warning: {
      bg: 'bg-[#FCEFE6]',
      border: 'border-[#F5C9A8]',
      badge: 'bg-[#FCEFE6] text-[#E07B39]',
      text: 'text-[#E07B39]',
    },
    caution: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-700',
      text: 'text-yellow-600',
    },
    'expiring-soon': {
      bg: 'bg-[#FFF3CD]',
      border: 'border-[#FFE08A]',
      badge: 'bg-[#FFF3CD] text-[#8A6D3B]',
      text: 'text-[#8A6D3B]',
    },
  };

  const displayRecords = useMemo(() => {
    const combined = [...expiringRecords, ...overdueRecords];
    const seen = new Set<number>();
    return combined.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [expiringRecords, overdueRecords]);

  const returnDraft = restoreDraft?.type === 'return' ? restoreDraft : getReturnDraft();

  if (displayRecords.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-bold text-[#2C2C2C]"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            逾期提醒
          </h2>
          <p className="text-sm text-gray-500 mt-1">跟踪逾期和即将到期的图书</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5DFD3] p-12 text-center shadow-sm">
          <Clock className="w-16 h-16 text-[#B8D4B0] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">暂无需要关注的图书</h3>
          <p className="text-gray-500">所有图书都在按时归还中</p>
        </div>
      </div>
    );
  }

  const getRowStatus = (record: typeof displayRecords[0]) => {
    if (record.isOverdue) {
      return getOverdueSeverity(record.overdueDays);
    }
    return 'expiring-soon';
  };

  const getStatusLabel = (record: typeof displayRecords[0]) => {
    if (record.isOverdue) {
      return `${record.overdueDays} 天`;
    }
    const days = getDaysUntilDue(record.expectedReturnDate);
    if (days === 0) return '今日到期';
    if (days === 1) return '明天到期';
    return `${days} 天后`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-bold text-[#2C2C2C]"
          style={{ fontFamily: '"Noto Serif SC", serif' }}
        >
          逾期提醒
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          共 {displayRecords.length} 册需要关注（{expiringRecords.length} 册即将到期，{overdueRecords.length} 册已逾期）
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5DFD3] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F2EB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  柜格
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  书名
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  借阅人
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  借阅日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  应还日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]">
              {displayRecords.map(record => {
                const cabinet = cabinetMap.get(record.cabinetId);
                const status = getRowStatus(record);
                const config = severityConfig[status];
                const isExpiring = status === 'expiring-soon';
                return (
                  <tr
                    key={record.id}
                    className={cn('hover:bg-gray-50 transition-colors', config.bg)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/cabinet/${record.cabinetId}`)}
                        className="text-[#2D5A27] hover:underline font-medium"
                      >
                        {cabinet?.code || '-'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <BookOpen className={cn('w-4 h-4', isExpiring ? 'text-[#F0AD4E]' : 'text-gray-400')} />
                        <span className="font-medium text-[#2C2C2C]">{record.bookTitle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{record.residentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(record.borrowDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(isExpiring && 'text-[#E07B39] font-medium')}>
                        {formatDate(record.expectedReturnDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit', config.badge)}>
                        {isExpiring && <Clock className="w-3 h-3" />}
                        {getStatusLabel(record)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {!record.actualReturnDate && (
                        <button
                          onClick={() => setSelectedRecord(record.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2D5A27] text-white text-sm rounded-lg hover:bg-[#234A1F] transition-colors"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          还书
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#FCEFE6] border border-[#F5C9A8] rounded-xl p-4">
        <p className="text-[#E07B39] text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>说明：</strong>
            <span className="text-[#8A6D3B] bg-[#FFF3CD] px-1 rounded">黄色</span>
            表示即将到期（3天内），
            <span className="text-[#E07B39] bg-[#FCEFE6] px-1 rounded">橙色</span>
            表示已逾期。图书逾期超过 3 天未还，所在柜格将自动进入「待清柜」状态。
            清柜完成前，该柜格无法接受新的借书登记，但仍可接受还书。
          </span>
        </p>
      </div>

      {selectedRecord !== null && (
        <Modal
          isOpen={true}
          onClose={() => {
            saveReturnDraft({
              recordId: '',
              actualReturnDate: '',
              wearLevel: 2,
            });
            setSelectedRecord(null);
            setRestoreDraft(null);
          }}
          title="还书登记"
        >
          <ReturnForm
            records={allRecords}
            preselectedRecordId={selectedRecord}
            onSuccess={handleSuccess}
            onClose={() => {
              saveReturnDraft({
                recordId: '',
                actualReturnDate: '',
                wearLevel: 2,
              });
              setSelectedRecord(null);
              setRestoreDraft(null);
            }}
            draft={returnDraft}
            onSaveDraft={saveReturnDraft}
            onClearDraft={() => clearDraft('return')}
            source="overdue"
          />
        </Modal>
      )}
    </div>
  );
}
