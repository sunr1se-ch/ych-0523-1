import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, LayoutGrid, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: '柜格总览', icon: LayoutGrid },
  { path: '/cleanup', label: '待清柜', icon: AlertTriangle },
  { path: '/overdue', label: '逾期提醒', icon: Clock },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-white border-b border-[#E5DFD3] shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A27] rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#2C2C2C]" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                  旧书漂流柜
                </h1>
                <p className="text-xs text-gray-500">流转登记系统</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#2D5A27] text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#2D5A27]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5DFD3] z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 min-w-[60px]',
                  isActive ? 'text-[#2D5A27]' : 'text-gray-500'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
