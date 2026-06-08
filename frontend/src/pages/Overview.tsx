import { useEffect, useState } from 'react';
import { LayoutGrid, BookOpen, AlertTriangle, CheckCircle, Plus, ArrowDownToLine } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatsCard from '../components/StatsCard';
import CabinetCard from '../components/CabinetCard';
import Modal from '../components/Modal';
import BorrowForm from '../components/BorrowForm';
import ReturnForm from '../components/ReturnForm';

export default function Overview() {
  const { stats, cabinets, activeRecords, fetchStats, fetchCabinets, fetchActiveRecords, refreshAll } = useAppStore();
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchCabinets();
    fetchActiveRecords();
  }, [fetchStats, fetchCabinets, fetchActiveRecords]);

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
        onClose={() => setShowBorrowModal(false)}
        title="借书登记"
      >
        <BorrowForm
          cabinets={cabinets}
          onSuccess={refreshAll}
          onClose={() => setShowBorrowModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="还书登记"
      >
        <ReturnForm
          records={activeRecords}
          onSuccess={refreshAll}
          onClose={() => setShowReturnModal(false)}
        />
      </Modal>
    </div>
  );
}
