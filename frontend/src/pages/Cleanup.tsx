import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, CheckCircle, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { statusLabels } from '../types';
import Modal from '../components/Modal';
import CleanupForm from '../components/CleanupForm';
import { formatDate } from '../utils/format';
import { cn } from '../lib/utils';

export default function Cleanup() {
  const navigate = useNavigate();
  const { pendingCleanup, cabinets, fetchPendingCleanup, fetchCabinets, refreshAll } = useAppStore();
  const [selectedCabinet, setSelectedCabinet] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingCleanup();
    fetchCabinets();
  }, [fetchPendingCleanup, fetchCabinets]);

  const cabinetMap = new Map(cabinets.map(c => [c.id, c]));

  const getOverdueInfo = (cabinetId: number) => {
    const cabinet = cabinetMap.get(cabinetId);
    if (!cabinet) return { count: 0, maxDays: 0 };

    const records = useAppStore.getState().currentCabinet?.records || [];
    const cabinetRecords = records.filter(
      r => r.cabinetId === cabinetId && !r.actualReturnDate && r.isOverdue
    );

    if (cabinetRecords.length === 0) {
      return { count: cabinet.currentCount, maxDays: 0 };
    }

    return {
      count: cabinetRecords.length,
      maxDays: Math.max(...cabinetRecords.map(r => r.overdueDays)),
    };
  };

  const handleSuccess = () => {
    setSelectedCabinet(null);
    refreshAll();
  };

  if (pendingCleanup.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-bold text-[#2C2C2C]"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            待清柜管理
          </h2>
          <p className="text-sm text-gray-500 mt-1">处理逾期柜格，恢复正常使用</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5DFD3] p-12 text-center shadow-sm">
          <CheckCircle className="w-16 h-16 text-[#B8D4B0] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">暂无待清柜</h3>
          <p className="text-gray-500">所有柜格状态正常</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-bold text-[#2C2C2C]"
          style={{ fontFamily: '"Noto Serif SC", serif' }}
        >
          待清柜管理
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          共 {pendingCleanup.length} 个柜格需要清柜处理
        </p>
      </div>

      <div className="bg-[#FCEFE6] border border-[#F5C9A8] rounded-xl p-4">
        <p className="text-[#E07B39] text-sm">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          <strong>注意：</strong>待清柜期间仍可接受还书登记，但系统不会自动解除待清柜状态。
          管理员必须手动确认清柜后，柜格才能恢复正常使用。
        </p>
      </div>

      <div className="space-y-4">
        {pendingCleanup.map(cabinet => {
          const overdueInfo = getOverdueInfo(cabinet.id);
          return (
            <div
              key={cabinet.id}
              className="bg-white rounded-xl border border-[#E5DFD3] p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FCEFE6] border-2 border-[#F5C9A8] rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-[#E07B39]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-[#2C2C2C] text-lg">
                        柜格 {cabinet.code}
                      </h3>
                      <span className="px-2 py-1 bg-[#FCEFE6] text-[#E07B39] text-xs font-medium rounded">
                        {statusLabels[cabinet.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      当前在借：{cabinet.currentCount} / {cabinet.capacity} 册
                      {overdueInfo.count > 0 && (
                        <span className="text-[#E07B39] ml-2">
                          · 其中逾期 {overdueInfo.count} 册
                          {overdueInfo.maxDays > 0 && `，最长逾期 ${overdueInfo.maxDays} 天`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/cabinet/${cabinet.id}`)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                  <button
                    onClick={() => setSelectedCabinet(cabinet.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E07B39] text-white rounded-lg hover:bg-[#C96A2E] transition-colors shadow-md hover:shadow-lg"
                  >
                    <CheckCircle className="w-4 h-4" />
                    确认清柜
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCabinet !== null && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCabinet(null)}
          title="确认清柜"
        >
          <CleanupForm
            cabinet={cabinetMap.get(selectedCabinet)!}
            onSuccess={handleSuccess}
            onClose={() => setSelectedCabinet(null)}
          />
        </Modal>
      )}
    </div>
  );
}
