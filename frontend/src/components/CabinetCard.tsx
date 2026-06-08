import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Cabinet } from '../types';
import { statusLabels } from '../types';
import { cn } from '../lib/utils';

interface CabinetCardProps {
  cabinet: Cabinet;
}

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

export default function CabinetCard({ cabinet }: CabinetCardProps) {
  const navigate = useNavigate();
  const config = statusConfig[cabinet.status];
  const Icon = config.icon;

  return (
    <button
      onClick={() => navigate(`/cabinet/${cabinet.id}`)}
      className={cn(
        'p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left w-full',
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-lg font-bold text-[#2C2C2C]">{cabinet.code}</p>
          <p className={cn('text-xs font-medium', config.text)}>
            {statusLabels[cabinet.status]}
          </p>
        </div>
        <Icon className={cn('w-5 h-5', config.text)} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: cabinet.capacity }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-6 rounded-sm transition-all duration-300',
                i < cabinet.currentCount
                  ? 'bg-[#2D5A27]'
                  : 'bg-white bg-opacity-60'
              )}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">
          {cabinet.currentCount}/{cabinet.capacity}
        </p>
      </div>
    </button>
  );
}
