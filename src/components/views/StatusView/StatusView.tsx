import { Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { TodoStatus } from '../../../types';
import { STATUS_LABELS } from '../../../types';
import { useTodoStore } from '../../../store/todoStore';
import { useUIStore } from '../../../store/uiStore';
import { groupByStatus, filterTodos } from '../../../utils/todoUtils';
import { TodoItem } from '../../todo/TodoItem';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useState } from 'react';

const STATUS_ORDER: TodoStatus[] = ['todo', 'in_progress', 'done', 'cancelled'];

interface StatusColumnProps {
  status: TodoStatus;
  todos: ReturnType<typeof groupByStatus>[TodoStatus];
}

function StatusColumn({ status, todos }: StatusColumnProps) {
  const { clearCompleted } = useTodoStore();
  const { openCreateModal } = useUIStore();
  const { setNodeRef } = useDroppable({ id: `status-column-${status}` });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <>
      <div className="col" data-st={status === 'in_progress' ? 'doing' : status}>
        <header className="col-head">
          <span className="ind" />
          <span className="lab">{STATUS_LABELS[status]}</span>
          <span className="cnt">{todos.length}</span>
          <button className="add" onClick={() => openCreateModal(undefined, status)} aria-label="添加">
            <Plus size={14} />
          </button>
        </header>

        <div className="col-body" ref={setNodeRef}>
          <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {todos.length > 0 ? (
              todos.map(todo => (
                <TodoItem key={todo.id} todo={todo} variant="card" />
              ))
            ) : (
              <button onClick={() => openCreateModal(undefined, status)} className="empty-col w-full block">拖入或点击 + 添加</button>
            )}
          </SortableContext>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="清除已完成"
        message={`确定要清除全部 ${todos.length} 个已完成的待办吗？`}
        confirmLabel="清除"
        onConfirm={() => { clearCompleted(); setShowClearConfirm(false); }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}

export function StatusView() {
  const { todos } = useTodoStore();
  const { searchQuery, tagFilter, dateFilter } = useUIStore();
  const filtered = filterTodos(todos, searchQuery, tagFilter, dateFilter);
  const groups = groupByStatus(filtered);

  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
      <div className="kanban">
        {STATUS_ORDER.map(status => (
          <StatusColumn key={status} status={status} todos={groups[status]} />
        ))}
      </div>
    </div>
  );
}
