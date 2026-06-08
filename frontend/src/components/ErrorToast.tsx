import { X, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';

export default function ErrorToast() {
  const { error, setError } = useAppStore();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm flex-1">{error}</p>
        <button
          onClick={() => setError(null)}
          className="p-1 hover:bg-red-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
