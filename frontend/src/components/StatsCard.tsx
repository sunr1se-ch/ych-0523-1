import { cn } from '../lib/utils';

interface StatsCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'orange' | 'gray';
}

const colorClasses: Record<StatsCardProps['color'], string> = {
  green: 'bg-[#E8F2E6] border-[#B8D4B0] text-[#2D5A27]',
  blue: 'bg-[#E6EEF7] border-[#B0CCE8] text-[#1E4A7E]',
  orange: 'bg-[#FCEFE6] border-[#F5C9A8] text-[#E07B39]',
  gray: 'bg-[#F0EDE8] border-[#D6D0C4] text-[#5C5C5C]',
};

export default function StatsCard({ label, value, icon, color }: StatsCardProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80 mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="w-12 h-12 bg-white bg-opacity-60 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
