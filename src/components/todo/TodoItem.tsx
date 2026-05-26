import { useState } from 'react';
import { Trash2, Pencil, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Todo } from '../../types';
import { PRIORITY_LABELS } from '../../types';
import { useTodoStore } from '../../store/todoStore';
import { useUIStore } from '../../store/uiStore';
import { formatDateShort } from '../../utils/dateUtils';
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

  const handleCheck = () => {
    toggleComplete(todo.id);
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
          {...attributes}
          {...listeners}
          onClick={() => openEditModal(todo.id)}
          className={clsx('card', priCls, doneCls, isDragging && 'opacity-50')}
        >
          <div className="ttl">
            <div
              className={clsx('check', isDone ? 'done' : '')}
              onClick={(e) => { e.stopPropagation(); handleCheck(); }}
            />
            <span className={isDone ? 'line-through text-[var(--ink-3)]' : ''}>{todo.title}</span>
          </div>
          <div className="meta">
            {showDate && todo.dueDate && (
              <span className="dt"><Calendar size={11} /> {formatDateShort(todo.dueDate)}</span>
            )}
            {todo.priority !== 'none' && (
              <span className={`chip ${todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warn' : 'info'}`}>
                <span className={`dot ${todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warn' : 'info'}`} />
                {PRIORITY_LABELS[todo.priority].replace('优先级', '')}
              </span>
            )}
            {todo.status === 'in_progress' && <span className="chip warn">进行中</span>}
          </div>

          <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={(e) => { e.stopPropagation(); openEditModal(todo.id); }} className="p-1 text-[var(--ink-3)] hover:text-[var(--ink-1)]"><Pencil size={11} /></button>
             <button onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }} className="p-1 text-[var(--ink-3)] hover:text-[var(--danger)]"><Trash2 size={11} /></button>
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
        className={clsx('task', priCls, doneCls, isDragging && 'opacity-50')}
      >
        <span className="pri-mark" />
        <div
          className={clsx('check', isDone ? 'done' : '')}
          onClick={(e) => { e.stopPropagation(); handleCheck(); }}
        />
        <div className="task-main">
          <div className="task-title">{todo.title}</div>
          <div className="task-meta">
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
           <button onClick={(e) => { e.stopPropagation(); openEditModal(todo.id); }} className="p-1 text-[var(--ink-3)] hover:text-[var(--ink-1)]"><Pencil size={12} /></button>
           <button onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }} className="p-1 text-[var(--ink-3)] hover:text-[var(--danger)]"><Trash2 size={12} /></button>
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
