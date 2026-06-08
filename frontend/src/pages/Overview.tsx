import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, BookOpen, AlertTriangle, CheckCircle, Plus, ArrowDownToLine, Clock, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatsCard from '../components/StatsCard';
import CabinetCard from '../components/CabinetCard';
import Modal from '../components/Modal';
import BorrowForm from '../components/BorrowForm';
import ReturnForm from '../components/ReturnForm';
import { useDraft } from '../hooks/useDraft';
import { getDaysUntilDue, getExpiringRecords } from '../hooks/useDraft';
import { formatDate } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import type { Draft } from '../types';

export default function Overview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stats, cabinets, activeRecords, fetchStats, fetchCabinets, fetchActiveRecords, refreshAll } = useAppStore();
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [restoreDraft, setRestoreDraft] = useState<Draft | null>(null);

  const {
    saveBorrowDraft,
    saveReturnDraft,
    clearDraft,
    getBorrowDraft,
    getReturnDraft,
    refreshDrafts,
  } = useDraft({
    source: 'overview',
    cabinets,
    records: activeRecords,
  });

  useEffect(() => {
    fetchStats();
    fetchCabinets();
    fetchActiveRecords();
  }, [fetchStats, fetchCabinets, fetchActiveRecords]);

  useEffect(() => {
    const state = location.state as { restoreDraft?: Draft } | null;
    if (state?.restoreDraft) {
      const draft = state.restoreDraft;
      setRestoreDraft(draft);
      if (draft.type === 'borrow') {
        setShowBorrowModal(true);
      } else {
        setShowReturnModal(true);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    refreshDrafts();
  }, [showBorrowModal, showReturnModal, refreshDrafts]);

  const expiringRecords = useMemo(() => getExpiringRecords(activeRecords), [activeRecords]);

  const handleBorrowSuccess = () => {
    clearDraft('borrow');
    refreshAll();
    setRestoreDraft(null);
  };

  const handleReturnSuccess = () => {
    clearDraft('return');
    refreshAll();
    setRestoreDraft(null);
  };

  const borrowDraft = restoreDraft?.type === 'borrow' ? restoreDraft : getBorrowDraft();
  const returnDraft = restoreDraft?.type === 'return' ? restoreDraft : getReturnDraft();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold text-[#2C2C2C]"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            柜格总览
          </h2>
          <p className="text-sm text-gray-500 mt-1">实时监控所有柜格的状态</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBorrowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#234A1F] transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">借书登记</span>
          </button>
          <button
            onClick={() => setShowReturnModal(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#2D5A27] text-[#2D5A27] rounded-lg hover:bg-[#E8F2E6] transition-all"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span className="hidden sm:inline">还书登记</span>
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="总柜格数"
            value={stats.total}
            icon={<LayoutGrid className="w-6 h-6" />}
            color="gray"
          />
          <StatsCard
            label="可用空位"
            value={stats.available}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          <StatsCard
            label="在借中"
            value={stats.borrowed}
            icon={<BookOpen className="w-6 h-6" />}
            color="blue"
          />
          <StatsCard
            label="待清柜"
            value={stats.pendingCleanup}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="orange"
          />
        </div>
      )}

      {expiringRecords.length > 0 && (
        <div className="bg-[#FFF3CD] border border-[#FFE08A] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#F0AD4E] rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#8A6D3B]" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                即将到期提醒
              </h3>
              <p className="text-sm text-[#A0845C]">
                共 {expiringRecords.length} 册图书将在 3 天内到期
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            {expiringRecords.map(record => {
              const days = getDaysUntilDue(record.expectedReturnDate);
              const cabinet = cabinets.find(c => c.id === record.cabinetId);
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between bg-white rounded-xl p-4 border border-[#FFE08A]"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-[#F0AD4E]" />
                    <div>
                      <p className="font-medium text-[#2C2C2C]">{record.bookTitle}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        {record.residentName}
                        <span className="text-gray-300">|</span>
                        柜格：{cabinet?.code || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">预计归还</p>
                      <p className="font-medium text-[#E07B39]">{formatDate(record.expectedReturnDate)}</p>
                    </div>
                    <span className="px-3 py-1 bg-[#F0AD4E] text-white text-sm font-medium rounded-full">
                      {days === 0 ? '今日到期' : days === 1 ? '明天到期' : `${days}天后`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E5DFD3] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2C2C2C]">所有柜格</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-[#B8D4B0]" />
              <span className="text-gray-500">空位</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-[#B0CCE8]" />
              <span className="text-gray-500">在借</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-[#F0AD4E]" />
              <span className="text-gray-500">即将到期</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-[#D6D0C4]" />
              <span className="text-gray-500">已满</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-[#F5C9A8]" />
              <span className="text-gray-500">待清柜</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cabinets.map(cabinet => (
            <CabinetCard key={cabinet.id} cabinet={cabinet} />
          ))}
        </div>
      </div>

      <Modal
        isOpen={showBorrowModal}
        onClose={() => {
          saveBorrowDraft({
            cabinetId: '',
            residentName: '',
            bookTitle: '',
            borrowDate: '',
            expectedReturnDate: '',
          });
          setShowBorrowModal(false);
          setRestoreDraft(null);
        }}
        title="借书登记"
      >
        <BorrowForm
          cabinets={cabinets}
          onSuccess={handleBorrowSuccess}
          onClose={() => {
            saveBorrowDraft({
              cabinetId: '',
              residentName: '',
              bookTitle: '',
              borrowDate: '',
              expectedReturnDate: '',
            });
            setShowBorrowModal(false);
            setRestoreDraft(null);
          }}
          draft={borrowDraft}
          onSaveDraft={saveBorrowDraft}
          onClearDraft={() => clearDraft('borrow')}
          source="overview"
        />
      </Modal>

      <Modal
        isOpen={showReturnModal}
        onClose={() => {
          saveReturnDraft({
            recordId: '',
            actualReturnDate: '',
            wearLevel: 2,
          });
          setShowReturnModal(false);
          setRestoreDraft(null);
        }}
        title="还书登记"
      >
        <ReturnForm
          records={activeRecords}
          onSuccess={handleReturnSuccess}
          onClose={() => {
            saveReturnDraft({
              recordId: '',
              actualReturnDate: '',
              wearLevel: 2,
            });
            setShowReturnModal(false);
            setRestoreDraft(null);
          }}
          draft={returnDraft}
          onSaveDraft={saveReturnDraft}
          onClearDraft={() => clearDraft('return')}
          source="overview"
        />
      </Modal>
    </div>
  );
}
