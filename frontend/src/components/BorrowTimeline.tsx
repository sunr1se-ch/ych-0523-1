import { BookOpen, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import type { BorrowRecord } from '../types';
import { wearLevelLabels } from '../types';
import { formatDate } from '../utils/format';
import { cn } from '../lib/utils';
import { isExpiringSoon, getDaysUntilDue } from '../hooks/useDraft';

interface BorrowTimelineProps {
  records: BorrowRecord[];
}

export default function BorrowTimeline({ records }: BorrowTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>暂无借阅记录</p>
      </div>
    );
  }

  const getRecordStatus = (record: BorrowRecord) => {
    if (record.actualReturnDate) return 'returned';
    if (record.isOverdue) return 'overdue';
    if (isExpiringSoon(record)) return 'expiring-soon';
    return 'borrowing';
  };

  const statusConfig = {
    returned: {
      dot: 'bg-[#B8D4B0]',
      border: 'border-[#E5DFD3]',
      badge: 'bg-[#E8F2E6] text-[#2D5A27]',
      label: '已归还',
    },
    overdue: {
      dot: 'bg-[#E07B39]',
      border: 'border-[#E07B39]',
      badge: 'bg-[#FCEFE6] text-[#E07B39]',
      label: (record: BorrowRecord) => `逾期 ${record.overdueDays} 天`,
      icon: AlertTriangle,
    },
    'expiring-soon': {
      dot: 'bg-[#F0AD4E]',
      border: 'border-[#F0AD4E]',
      badge: 'bg-[#FFF3CD] text-[#8A6D3B]',
      label: (record: BorrowRecord) => {
        const days = getDaysUntilDue(record.expectedReturnDate);
        if (days === 0) return '今日到期';
        if (days === 1) return '明天到期';
        return `${days} 天后到期`;
      },
      icon: Clock,
    },
    borrowing: {
      dot: 'bg-[#B0CCE8]',
      border: 'border-[#E5DFD3]',
      badge: 'bg-[#E6EEF7] text-[#1E4A7E]',
      label: '借阅中',
    },
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E5DFD3]" />
      <div className="space-y-6">
        {records.map((record) => {
          const status = getRecordStatus(record);
          const config = statusConfig[status];
          const StatusIcon = 'icon' in config ? config.icon : null;
          const label = typeof config.label === 'function' ? config.label(record) : config.label;

          return (
            <div key={record.id} className="relative pl-12">
              <div
                className={cn(
                  'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#FAF7F2]',
                  config.dot
                )}
              >
                {StatusIcon && (
                  <StatusIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={cn(
                  'bg-white rounded-xl p-4 border shadow-sm',
                  config.border
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-[#2C2C2C]">{record.bookTitle}</h4>
                    <p className="text-sm text-gray-500">借阅人：{record.residentName}</p>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium flex items-center gap-1',
                      config.badge
                    )}
                  >
                    {StatusIcon && <StatusIcon className="w-3 h-3" />}
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{formatDate(record.borrowDate)}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span
                    className={cn(
                      status === 'expiring-soon' && 'text-[#E07B39] font-medium'
                    )}
                  >
                    预计：{formatDate(record.expectedReturnDate)}
                  </span>
                </div>
                {record.actualReturnDate && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      实际归还：{formatDate(record.actualReturnDate)}
                    </p>
                    {record.wearLevel && (
                      <p className="text-sm text-gray-500 mt-1">
                        书脊磨损：{wearLevelLabels[record.wearLevel]}（等级 {record.wearLevel}）
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
