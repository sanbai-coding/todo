import { Plus, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useTodoStore } from '../../../store/todoStore';
import { useUIStore } from '../../../store/uiStore';
import { groupByDate, filterTodos } from '../../../utils/todoUtils';
import { getNext7Days, getDayLabel, dateToStr } from '../../../utils/dateUtils';
import { TodoItem } from '../../todo/TodoItem';

function DroppableDay({ dateStr, children }: { dateStr: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `timeline-date-${dateStr}` });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'min-h-[44px] rounded-xl transition-colors',
        isOver ? 'bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400/40' : ''
      )}
    >
      {children}
    </div>
  );
}

export function TimelineView() {
  const { todos } = useTodoStore();
  const { searchQuery, openCreateModal, collapsedOverdue, toggleOverdue, openListModal } = useUIStore();

  const filtered = filterTodos(todos, searchQuery);
  const { overdue, today, byDate } = groupByDate(filtered);
  const next7 = getNext7Days().slice(1);

  const todayStr = dateToStr(new Date());
  const doneToday = todos.filter(t => t.status === 'done' && t.dueDate === todayStr).length;
  const totalToday = today.length + doneToday;
  const progressPct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto min-h-0">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        {/* === OVERDUE === */}
        {overdue.length > 0 && (
          <div className="rounded-2xl border border-red-100 dark:border-red-900/40 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <button
              onClick={toggleOverdue}
              className="w-full flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/40"
            >
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">逾期未完成</span>
              <span className="ml-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                {overdue.length}
              </span>
              <div className="ml-auto">
                {collapsedOverdue
                  ? <ChevronRight size={14} className="text-red-400" />
                  : <ChevronDown size={14} className="text-red-400" />
                }
              </div>
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: collapsedOverdue ? 0 : 9999 }}
            >
              <div className="p-3 space-y-2">
                <DroppableDay dateStr="overdue">
                  <SortableContext items={overdue.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {overdue.map(todo => <TodoItem key={todo.id} todo={todo} showDate={true} />)}
                  </SortableContext>
                </DroppableDay>
              </div>
            </div>
          </div>
        )}

        {/* === TODAY === */}
        <div className="overview">
          <div className="ov-cell">
            <div className="lbl">今日</div>
            <div className="num">{doneToday}<span className="total"> / {totalToday}</span></div>
            <div className="bar"><i style={{ width: `${progressPct}%` }}/></div>
          </div>
          <button className="ov-cell text-left" onClick={() => openListModal('in_progress')}>
            <div className="lbl"><span className="dot warn" />进行中</div>
            <div className="num">{todos.filter(t => t.status === 'in_progress').length}</div>
            <div className="bar warn"><i style={{ width: "100%" }}/></div>
          </button>
          <button className="ov-cell text-left" onClick={() => openListModal('high_priority')}>
            <div className="lbl"><span className="dot danger" />高优先级</div>
            <div className="num">{todos.filter(t => t.priority === 'high').length}</div>
            <div className="bar danger"><i style={{ width: "100%" }}/></div>
          </button>
          <div className="ov-cell">
            <div className="lbl">本周完成率</div>
            <div className="num">0<span className="total">%</span></div>
            <div className="bar"><i style={{ width: "0%" }}/></div>
          </div>
        </div>

        <section className="day-block">
          <header className="day-head today">
            <div>
              <div className="wd">今天</div>
              <div className="dt">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</div>
            </div>
            <div className="meta">
              <span>{today.length} 项</span>
              <button onClick={() => openCreateModal(todayStr)} className="add"><Plus size={14}/><span>添加</span></button>
            </div>
          </header>
          <DroppableDay dateStr={todayStr}>
            <SortableContext items={today.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {today.length > 0 ? (
                <div className="task-list">
                  {today.map(todo => <TodoItem key={todo.id} todo={todo} showDate={false} />)}
                </div>
              ) : (
                <button onClick={() => openCreateModal(todayStr)} className="empty-row w-full block">点击或拖入添加任务</button>
              )}
            </SortableContext>
          </DroppableDay>
        </section>

        {/* === FUTURE DAYS === */}
        {next7.map(dateStr => {
          const dayTodos = byDate[dateStr] ?? [];
          return (
            <section key={dateStr} className="day-block">
              <header className="day-head">
                <div>
                  <div className="wd">{getDayLabel(dateStr)}</div>
                  <div className="dt">{new Date(dateStr).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</div>
                </div>
                <div className="meta">
                  {dayTodos.length > 0 && <span>{dayTodos.length} 项</span>}
                  <button onClick={() => openCreateModal(dateStr)} className="add"><Plus size={14}/><span>添加</span></button>
                </div>
              </header>
              <DroppableDay dateStr={dateStr}>
                <SortableContext items={dayTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {dayTodos.length > 0 ? (
                    <div className="task-list">
                      {dayTodos.map(todo => <TodoItem key={todo.id} todo={todo} showDate={false} />)}
                    </div>
                  ) : (
                    <button onClick={() => openCreateModal(dateStr)} className="empty-row w-full block">点击或拖入添加任务</button>
                  )}
                </SortableContext>
              </DroppableDay>
            </section>
          );
        })}

        <div className="h-8" />
      </div>
    </div>
  );
}
