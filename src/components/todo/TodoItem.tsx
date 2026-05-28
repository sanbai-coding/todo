import { useState } from 'react';
import { Pencil, Zap, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Todo } from '../../types';
import { PRIORITY_LABELS } from '../../types';
import { useTodoStore } from '../../store/todoStore';
import { useUIStore } from '../../store/uiStore';
import { formatDateShort, isOverdue, dateToStr } from '../../utils/dateUtils';
import { getTagColor } from '../../utils/colorUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

export interface TodoItemProps {
  todo: Todo;
  showDate?: boolean;
  variant?: 'row' | 'card';
}

export function TodoItem({ todo, showDate = true, variant = 'row' }: TodoItemProps) {
  const { toggleComplete, deleteTodo } = useTodoStore();
  const { openEditModal } = useUIStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDone = todo.status === 'done';
  const isTodoOverdue = !isDone && todo.status !== 'cancelled' && todo.dueDate && isOverdue(todo.dueDate);

  const handleCheck = () => {
    toggleComplete(todo.id);
  };

  const handleSetToday = () => {
    useTodoStore.getState().updateTodo(todo.id, { dueDate: dateToStr(new Date()) });
    useUIStore.getState().showToast('已设为今日待办');
  };

  const priMap: Record<string, string> = { high: 'h', medium: 'm', low: 'l', none: '' };
  const priChar = priMap[todo.priority];
  const priCls = priChar ? `pri-${priChar}` : '';
  const doneCls = isDone ? 'done' : '';

  if (variant === 'card') {
    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          className={clsx(
            "card group",
            priCls,
            doneCls,
            isDragging && "opacity-50 ring-2 ring-[var(--brand)]"
          )}
          {...attributes}
          {...listeners}
          onClick={() => openEditModal(todo.id)}
        >
          <div className="ttl">
              <button
                onClick={(e) => { e.stopPropagation(); handleCheck(); }}
                className={clsx("check", isDone && "bg-[var(--line-strong)] done")}
              />
              <span className={clsx("name", isDone && "line-through text-[var(--ink-4)]")}>
                {todo.title}
              </span>
            </div>

          {!isDone && (todo.priority !== 'none' || todo.dueDate || (todo.tags && todo.tags.length > 0) || todo.note) && (
            <div className="meta">
              {todo.note && (
                <span className="chip !text-[var(--ink-2)] !bg-[var(--surface-2)] cursor-help" data-tooltip={todo.note}>
                  <FileText size={10} className="mr-0.5 inline-block opacity-70" />
                  备注
                </span>
              )}
              {todo.priority !== 'none' && (
                <span className={clsx("chip", todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warn' : '')}>
                  <span className="dot"></span>
                  {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                </span>
              )}
              {showDate && todo.dueDate && <span>{formatDateShort(todo.dueDate)}</span>}
              {todo.tags?.map(tag => (
                <span key={tag} className="tag text-[var(--bg)] shadow-sm font-medium px-1.5 py-0.5 rounded text-[10px]" style={{ background: getTagColor(tag) }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surface)] shadow-sm rounded-md px-1">
             {isTodoOverdue && (
               <button data-tooltip="设为今日" onClick={(e) => { e.stopPropagation(); handleSetToday(); }} className="p-1 text-[var(--ink-3)] hover:text-[var(--brand)]"><Zap size={11} className="fill-current" /></button>
             )}
             <button data-tooltip="编辑" onClick={(e) => { e.stopPropagation(); openEditModal(todo.id); }} className="p-1 text-[var(--ink-3)] hover:text-[var(--ink-1)]"><Pencil size={11} /></button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showConfirm}
          title="删除待办"
          message={`确定要删除「${todo.title}」吗？`}
          confirmLabel="删除"
          onConfirm={() => { deleteTodo(todo.id); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      </>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => openEditModal(todo.id)}
        className={clsx('task group', priCls, doneCls, isDragging && 'opacity-50')}
      >
        <span className="pri-mark" />
        <div
          className={clsx('check', isDone ? 'done' : '')}
          onClick={(e) => { e.stopPropagation(); handleCheck(); }}
        />
        <div className="task-main">
          <div className="task-title">{todo.title}</div>
          <div className="task-meta">
            {todo.note && (
              <span className="chip !text-[var(--ink-2)] !bg-[var(--surface-2)] cursor-help" data-tooltip={todo.note}>
                <FileText size={12} className="mr-0.5 inline-block opacity-70" />
                备注
              </span>
            )}
            {todo.tags?.map(tag => (
              <span key={tag} className="tag text-[var(--bg)] shadow-sm font-medium" style={{ background: getTagColor(tag) }}>
                {tag}
              </span>
            ))}
            {todo.priority !== 'none' && (
              <span className={`chip ${todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warn' : 'info'}`}>
                <span className={`dot ${todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warn' : 'info'}`} />
                {PRIORITY_LABELS[todo.priority].replace('优先级', '')}
              </span>
            )}
            {todo.status === 'in_progress' && <span className="chip warn">进行中</span>}
            {todo.status === 'done' && <span className="chip brand">已完成</span>}
            {todo.status === 'cancelled' && <span className="chip">已取消</span>}
          </div>
        </div>
        <div className="task-tail flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           {isTodoOverdue && (
             <button data-tooltip="设为今日" onClick={(e) => { e.stopPropagation(); handleSetToday(); }} className="p-1 text-[var(--ink-3)] hover:text-[var(--brand)]"><Zap size={12} className="fill-current" /></button>
           )}
           <button data-tooltip="编辑" onClick={(e) => { e.stopPropagation(); openEditModal(todo.id); }} className="p-1 text-[var(--ink-3)] hover:text-[var(--ink-1)]"><Pencil size={12} /></button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="删除待办"
        message={`确定要删除「${todo.title}」吗？`}
        confirmLabel="删除"
        onConfirm={() => { deleteTodo(todo.id); setShowConfirm(false); }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
