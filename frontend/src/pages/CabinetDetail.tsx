import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ArrowDownToLine, AlertTriangle, CheckCircle, BookOpen, XCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { statusLabels } from '../types';
import BorrowTimeline from '../components/BorrowTimeline';
import Modal from '../components/Modal';
import BorrowForm from '../components/BorrowForm';
import ReturnForm from '../components/ReturnForm';
import CleanupForm from '../components/CleanupForm';
import { cn } from '../lib/utils';

const statusConfig = {
  available: {
    bg: 'bg-[#E8F2E6]',
    border: 'border-[#B8D4B0]',
    text: 'text-[#2D5A27]',
    icon: CheckCircle,
  },
  partial: {
    bg: 'bg-[#E6EEF7]',
    border: 'border-[#B0CCE8]',
    text: 'text-[#1E4A7E]',
    icon: BookOpen,
  },
  full: {
    bg: 'bg-[#F0EDE8]',
    border: 'border-[#D6D0C4]',
    text: 'text-[#5C5C5C]',
    icon: XCircle,
  },
  pending_cleanup: {
    bg: 'bg-[#FCEFE6]',
    border: 'border-[#F5C9A8]',
    text: 'text-[#E07B39]',
    icon: AlertTriangle,
  },
};

export default function CabinetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCabinet, cabinets, fetchCabinet, refreshAll } = useAppStore();
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCabinet(Number(id));
    }
  }, [id, fetchCabinet]);

  if (!currentCabinet) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#2D5A27] border-t-transparent rounded-full" />
      </div>
    );
  }

  const config = statusConfig[currentCabinet.status];
  const StatusIcon = config.icon;
  const canBorrow = currentCabinet.status !== 'pending_cleanup' && currentCabinet.currentCount < currentCabinet.capacity;
  const activeRecords = currentCabinet.records.filter(r => !r.actualReturnDate);
  const canReturn = activeRecords.length > 0;

  const handleSuccess = async () => {
    if (id) await fetchCabinet(Number(id));
    await refreshAll();
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-[#2D5A27] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回总览
      </button>

      <div className="bg-white rounded-2xl border border-[#E5DFD3] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-16 h-16 rounded-xl flex items-center justify-center',
                config.bg,
                config.border,
                'border-2'
              )}
            >
              <StatusIcon className={cn('w-8 h-8', config.text)} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold text-[#2C2C2C]"
                style={{ fontFamily: '"Noto Serif SC", serif' }}
              >
                柜格 {currentCabinet.code}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', config.bg, config.text)}>
                  {statusLabels[currentCabinet.status]}
                </span>
                <span className="text-gray-500 text-sm">
                  容量：{currentCabinet.currentCount} / {currentCabinet.capacity}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowBorrowModal(true)}
              disabled={!canBorrow}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                canBorrow
                  ? 'bg-[#2D5A27] text-white hover:bg-[#234A1F] shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4" />
              借书登记
            </button>
            <button
              onClick={() => setShowReturnModal(true)}
              disabled={!canReturn}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                canReturn
                  ? 'border-2 border-[#2D5A27] text-[#2D5A27] hover:bg-[#E8F2E6]'
                  : 'border-2 border-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              <ArrowDownToLine className="w-4 h-4" />
              还书登记
            </button>
            {currentCabinet.status === 'pending_cleanup' && (
              <button
                onClick={() => setShowCleanupModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#E07B39] text-white rounded-lg hover:bg-[#C96A2E] transition-all shadow-md hover:shadow-lg"
              >
                <AlertTriangle className="w-4 h-4" />
                确认清柜
              </button>
            )}
          </div>
        </div>

        {currentCabinet.status === 'pending_cleanup' && (
          <div className="mt-4 p-4 bg-[#FCEFE6] border border-[#F5C9A8] rounded-lg">
            <p className="text-[#E07B39] text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                该柜格处于「待清柜」状态，当前禁止借书登记，但仍可接受还书。
                请先确认清柜后再进行借书操作。
                <br />
                <strong>规则说明：</strong>待清柜期间有人强行还书时，系统会正常登记还书信息并记录磨损等级，
                但柜格不会自动解除待清柜状态，仍需管理员手动确认清柜后才能恢复正常使用。
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5DFD3] p-6 shadow-sm">
        <h3
          className="text-lg font-semibold text-[#2C2C2C] mb-6"
          style={{ fontFamily: '"Noto Serif SC", serif' }}
        >
          借阅时间线
        </h3>
        <BorrowTimeline records={currentCabinet.records} />
      </div>

      <Modal
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        title="借书登记"
      >
        <BorrowForm
          cabinets={cabinets}
          preselectedCabinetId={currentCabinet.id}
          onSuccess={handleSuccess}
          onClose={() => setShowBorrowModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="还书登记"
      >
        <ReturnForm
          records={currentCabinet.records}
          onSuccess={handleSuccess}
          onClose={() => setShowReturnModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        title="确认清柜"
      >
        <CleanupForm
          cabinet={currentCabinet}
          onSuccess={handleSuccess}
          onClose={() => setShowCleanupModal(false)}
        />
      </Modal>
    </div>
  );
}
