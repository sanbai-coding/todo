import { Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { Quadrant } from '../../../types';
import { useTodoStore } from '../../../store/todoStore';
import { useUIStore } from '../../../store/uiStore';
import { groupByQuadrant, filterTodos } from '../../../utils/todoUtils';
import { TodoItem } from '../../todo/TodoItem';

const QUADRANT_CONFIG: Record<Quadrant, {
  k: string;
  tag: string;
  title: string;
  sub: string;
}> = {
  important_urgent: {
    k: 'q1',
    tag: 'Q1',
    title: '重要 · 紧急',
    sub: '立即处理',
  },
  important_not_urgent: {
    k: 'q2',
    tag: 'Q2',
    title: '重要 · 不紧急',
    sub: '计划安排',
  },
  not_important_urgent: {
    k: 'q3',
    tag: 'Q3',
    title: '不重要 · 紧急',
    sub: '委托他人',
  },
  not_important_not_urgent: {
    k: 'q4',
    tag: 'Q4',
    title: '不重要 · 不紧急',
    sub: '考虑删除',
  },
};

const QUADRANT_ORDER: Quadrant[] = [
  'important_urgent',
  'important_not_urgent',
  'not_important_urgent',
  'not_important_not_urgent',
];

interface QuadrantCellProps {
  quadrant: Quadrant;
  todos: ReturnType<typeof groupByQuadrant>[Quadrant];
}

function QuadrantCell({ quadrant, todos }: QuadrantCellProps) {
  const { openCreateModal } = useUIStore();
  const { setNodeRef } = useDroppable({ id: `quadrant-cell-${quadrant}` });
  const cfg = QUADRANT_CONFIG[quadrant];

  return (
    <div className={`quad ${cfg.k}`}>
      <header className="quad-head">
        <span className="q-tag">{cfg.tag}</span>
        <span className="title">{cfg.title}</span>
        <span className="cnt">{todos.length}</span>
        <button className="add" onClick={() => openCreateModal(undefined, undefined, quadrant)}><Plus size={14} /></button>
      </header>
      <div className="quad-sub">{cfg.sub}</div>

      <div className="quad-list" ref={setNodeRef}>
        <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {todos.length > 0 ? (
            todos.map(todo => (
              <TodoItem key={todo.id} todo={todo} variant="card" />
            ))
          ) : (
            <div className="empty-quad">拖入或 + 添加</div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export function QuadrantView() {
  const { todos } = useTodoStore();
  const { searchQuery } = useUIStore();
  const filtered = filterTodos(todos, searchQuery);
  const groups = groupByQuadrant(filtered);

  return (
    <div className="content">
      <div className="matrix">
        <div className="mx-axis-x">
          <span>← 紧急</span>
          <span>不紧急 →</span>
        </div>
        <div className="mx-axis-y">
          <span>← 不重要</span>
          <span>重要 →</span>
        </div>

        {QUADRANT_ORDER.map(q => (
          <QuadrantCell key={q} quadrant={q} todos={groups[q]} />
        ))}
      </div>
    </div>
  );
}
