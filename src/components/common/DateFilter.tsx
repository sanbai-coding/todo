import { useUIStore } from '../../store/uiStore';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export function DateFilter() {
  const { currentView, dateFilter, setDateFilter } = useUIStore();

  // Only show in kanban and matrix (quadrant) views
  if (currentView !== 'status' && currentView !== 'quadrant') {
    return null;
  }

  const isTodayOnly = dateFilter === 'today';

  return (
    <button 
      className={clsx("tagfilter-trigger !px-3", isTodayOnly ? "is-active" : "")}
      onClick={() => setDateFilter(isTodayOnly ? 'all' : 'today')}
      title={isTodayOnly ? "取消只看今日" : "只看今日"}
    >
      <span className={clsx(
        "flex items-center justify-center w-3.5 h-3.5 rounded-sm border",
        isTodayOnly 
          ? "bg-[var(--brand)] border-[var(--brand)] text-[var(--brand-ink)]" 
          : "border-[var(--ink-4)] text-transparent"
      )}>
        <Check size={10} strokeWidth={3} />
      </span>
      <span>仅今日</span>
    </button>
  );
}
