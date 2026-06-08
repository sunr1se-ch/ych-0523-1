import { BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';
import type { BorrowRecord } from '../types';
import { wearLevelLabels, statusLabels } from '../types';
import { formatDate } from '../utils/format';
import { cn } from '../lib/utils';

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

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E5DFD3]" />
      <div className="space-y-6">
        {records.map((record, index) => (
          <div key={record.id} className="relative pl-12">
            <div
              className={cn(
                'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#FAF7F2]',
                record.actualReturnDate
                  ? 'bg-[#B8D4B0]'
                  : record.isOverdue
                  ? 'bg-[#E07B39]'
                  : 'bg-[#B0CCE8]'
              )}
            >
              {!record.actualReturnDate && record.isOverdue && (
                <AlertTriangle className="w-4 h-4 text-white" />
              )}
            </div>
            <div
              className={cn(
                'bg-white rounded-xl p-4 border border-[#E5DFD3] shadow-sm',
                !record.actualReturnDate && record.isOverdue && 'border-[#E07B39]'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-[#2C2C2C]">{record.bookTitle}</h4>
                  <p className="text-sm text-gray-500">借阅人：{record.residentName}</p>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    record.actualReturnDate
                      ? 'bg-[#E8F2E6] text-[#2D5A27]'
                      : record.isOverdue
                      ? 'bg-[#FCEFE6] text-[#E07B39]'
                      : 'bg-[#E6EEF7] text-[#1E4A7E]'
                  )}
                >
                  {record.actualReturnDate
                    ? '已归还'
                    : record.isOverdue
                    ? `逾期 ${record.overdueDays} 天`
                    : '借阅中'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{formatDate(record.borrowDate)}</span>
                <ArrowRight className="w-4 h-4" />
                <span>预计：{formatDate(record.expectedReturnDate)}</span>
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
        ))}
      </div>
    </div>
  );
}
