import { CalendarDays, Kanban, Calendar, LayoutGrid, Plus, } from 'lucide-react';
import { clsx } from 'clsx';
import type { ViewType } from '../../types';
import { VIEWS } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { useTodoStore } from '../../store/todoStore';
import { isTodayStr } from '../../utils/dateUtils';

const VIEW_ICONS: Record<ViewType, React.ElementType> = {
  timeline: CalendarDays,
  status: Kanban,
  calendar: Calendar,
  quadrant: LayoutGrid,
};

export function Sidebar() {
  const { currentView, setView, openCreateModal, openListModal } = useUIStore();
  const { todos } = useTodoStore();

  const pendingCount = todos.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
  const doneCount = todos.filter(t => t.status === 'done').length;
  const todayCount = todos.filter(t =>
    t.dueDate && isTodayStr(t.dueDate) && t.status !== 'done' && t.status !== 'cancelled'
  ).length;

  return (
    <div className="side">
      <div className="side-brand">
        <div className="logo">周</div>
        <div className="wm">
          周周待办
          <small>保持专注，高效完成</small>
        </div>
      </div>

      <div className="side-stats">
        <button className="stat text-left" onClick={() => openListModal('pending')}>
          <div className="v">{pendingCount}</div>
          <div className="l">待完成</div>
        </button>
        <button className="stat text-left" onClick={() => openListModal('done')}>
          <div className="v">{doneCount}</div>
          <div className="l">已完成</div>
        </button>
      </div>

      <button onClick={() => openCreateModal()} className="side-cta">
        <Plus size={14} />
        新建待办
      </button>

      <div className="side-nav-label">视图</div>
      <nav className="side-nav">
        {VIEWS.map(view => {
          const Icon = VIEW_ICONS[view.type];
          const isActive = currentView === view.type;
          return (
            <button
              key={view.type}
              onClick={() => setView(view.type)}
              className={clsx('nav-item', isActive && 'active')}
            >
              <Icon size={15} />
              {view.label}
              {view.type === 'timeline' && todayCount > 0 && <span className="badge">{todayCount}</span>}
            </button>
          );
        })}
      </nav>

      <div className="side-foot">
        <span>共 {todos.length} 个待办</span>
        <span>⌘K</span>
      </div>
    </div>
  );
}
