import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, User, BookOpen, ArrowDownToLine } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/format';
import Modal from '../components/Modal';
import ReturnForm from '../components/ReturnForm';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Overdue() {
  const navigate = useNavigate();
  const { overdueRecords, cabinets, fetchOverdue, fetchCabinets, refreshAll } = useAppStore();
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);

  useEffect(() => {
    fetchOverdue();
    fetchCabinets();
  }, [fetchOverdue, fetchCabinets]);

  const cabinetMap = new Map(cabinets.map(c => [c.id, c]));

  const handleSuccess = () => {
    setSelectedRecord(null);
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
  };

  if (overdueRecords.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-bold text-[#2C2C2C]"
            style={{ fontFamily: '"Noto Serif SC", serif' }}
          >
            逾期提醒
          </h2>
          <p className="text-sm text-gray-500 mt-1">跟踪逾期未还的图书</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5DFD3] p-12 text-center shadow-sm">
          <Clock className="w-16 h-16 text-[#B8D4B0] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">暂无逾期图书</h3>
          <p className="text-gray-500">所有图书都在按时归还中</p>
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
          逾期提醒
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          共 {overdueRecords.length} 册图书逾期未还
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
                  逾期天数
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]">
              {overdueRecords.map(record => {
                const cabinet = cabinetMap.get(record.cabinetId);
                const severity = getOverdueSeverity(record.overdueDays);
                const config = severityConfig[severity];
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
                        <BookOpen className="w-4 h-4 text-gray-400" />
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
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(record.expectedReturnDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('px-3 py-1 rounded-full text-sm font-semibold', config.badge)}>
                        {record.overdueDays} 天
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedRecord(record.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2D5A27] text-white text-sm rounded-lg hover:bg-[#234A1F] transition-colors"
                      >
                        <ArrowDownToLine className="w-3 h-3" />
                        还书
                      </button>
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
            <strong>逾期说明：</strong>图书逾期超过 3 天未还，所在柜格将自动进入「待清柜」状态。
            清柜完成前，该柜格无法接受新的借书登记，但仍可接受还书。
            请及时联系居民归还图书，以避免柜格被锁定。
          </span>
        </p>
      </div>

      {selectedRecord !== null && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRecord(null)}
          title="还书登记"
        >
          <ReturnForm
            records={overdueRecords}
            preselectedRecordId={selectedRecord}
            onSuccess={handleSuccess}
            onClose={() => setSelectedRecord(null)}
          />
        </Modal>
      )}
    </div>
  );
}
