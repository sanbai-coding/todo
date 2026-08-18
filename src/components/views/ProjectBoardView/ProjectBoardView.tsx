import { useState } from 'react';
import { Plus, Zap, Pencil, RotateCcw, Trash2, FolderKanban } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { dragId } from '../../../utils/dndUtils';
import { usePlanStore } from '../../../store/planStore';
import { useTodoStore } from '../../../store/todoStore';
import { useUIStore } from '../../../store/uiStore';
import { TAG_TONES } from '../../../types';
import type { Plan, Project } from '../../../types';
import { useActiveBoardProject } from './useActiveBoardProject';
import { filterVisiblePlans } from '../../../utils/planUtils';
import { ShowCompletedToggle } from '../../common/ShowCompletedToggle';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { AutoGrowTextarea } from '../../common/AutoGrowTextarea';

/* ===== 单个规划事项卡片（视觉沿用状态看板的 .card） ===== */

interface PlanCardProps {
  plan: Plan;
  projectTone: string;
}

function PlanCard({ plan, projectTone }: PlanCardProps) {
  const { updatePlan, deletePlan, categories } = usePlanStore();
  const { todos, toggleComplete, addTodo, updateTodo } = useTodoStore();
  const { openCreateModal, openEditModal, showToast } = useUIStore();
  const todo = plan.todoId ? todos.find(t => t.id === plan.todoId) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(plan.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: dragId.plan(plan.id), disabled: isEditing });

  // 和删除项目/分类一致：只删规划事项，已经转出去的待办留在待办列表里，
  // 顺手把待办上指向它的 planId 清掉，免得留一个悬空引用。
  const handleDelete = () => {
    if (todo) updateTodo(todo.id, { planId: undefined });
    deletePlan(plan.id);
    setShowDeleteConfirm(false);
  };

  const categoryName = categories.find(c => c.id === plan.categoryId)?.name;
  const isDone = todo?.status === 'done';

  // 直接建成今日待办，和月度规划里的闪电按钮保持一致的行为
  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const todoId = addTodo({
      title: plan.title,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'todo',
      priority: 'none',
      quadrant: 'not_important_not_urgent',
      tags: categoryName ? [categoryName] : [],
      planId: plan.id,
      sortOrder: 0,
    });
    updatePlan(plan.id, { todoId });
    showToast('已设为今日待办');
  };

  // 打开完整的待办弹窗，可以自己挑日期/优先级/象限
  const handleSetTodo = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreateModal(
      undefined,
      undefined,
      undefined,
      plan.title,
      plan.id,
      categoryName ? [categoryName] : undefined
    );
  };

  const submitEdit = () => {
    const next = editTitle.trim();
    if (next && next !== plan.title) {
      updatePlan(plan.id, { title: next });
      if (todo) updateTodo(todo.id, { title: next });
    } else {
      setEditTitle(plan.title);
    }
    setIsEditing(false);
  };

  const formatDue = (dueDate?: string) => {
    if (!dueDate) return null;
    if (dueDate === format(new Date(), 'yyyy-MM-dd')) return '今日';
    return format(new Date(dueDate), 'M/d');
  };

  return (
    <>
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={clsx('card plan-card group', isDone && 'done', isDragging && 'is-dragging')}
      style={{
        '--proj-color': projectTone,
        transform: CSS.Transform.toString(transform),
        transition,
      } as React.CSSProperties}
      onClick={() => {
        if (todo) {
          openEditModal(todo.id);
        } else if (!isEditing) {
          setIsEditing(true);
        }
      }}
    >
      <div className="ttl">
        {todo ? (
          <button
            className={clsx('check', isDone && 'done')}
            aria-label={isDone ? '取消完成' : '标记完成'}
            onClick={(e) => { e.stopPropagation(); toggleComplete(todo.id); }}
          />
        ) : (
          <span className="plan-card-dot" />
        )}

        {isEditing ? (
          <AutoGrowTextarea
            className="flex-1 min-w-0"
            value={editTitle}
            onChange={setEditTitle}
            onSubmit={submitEdit}
            onCancel={() => {
              setEditTitle(plan.title);
              setIsEditing(false);
            }}
          />
        ) : (
          <span className={clsx('name', isDone && 'line-through text-[var(--ink-4)]')}>
            {plan.title}
          </span>
        )}
      </div>

      <div className="meta">
        {todo ? (
          <>
            <span
              className={clsx('plan-state', todo.status === 'in_progress' ? 's-doing' : `s-${todo.status}`)}
            >
              {todo.status === 'todo' && '未开始'}
              {todo.status === 'in_progress' && '进行中'}
              {todo.status === 'done' && '已完成'}
              {todo.status === 'cancelled' && '已取消'}
            </span>
            {todo.dueDate && <span>{formatDue(todo.dueDate)}</span>}
            {todo.priority !== 'none' && (
              <span className={clsx('chip', todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warn' : '')}>
                <span className="dot" />
                {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
              </span>
            )}
          </>
        ) : (
          <span className="plan-state s-plan">未转待办</span>
        )}
      </div>

      <div className="plan-card-actions">
        {!todo && (
          <>
            <button data-tooltip="设为今日待办" onClick={handleSetToday}>
              <Zap size={12} />
            </button>
            <button data-tooltip="设为待办" onClick={handleSetTodo}>
              <Pencil size={12} />
            </button>
          </>
        )}
        {todo && isDone && (
          <button data-tooltip="取消完成" onClick={(e) => { e.stopPropagation(); toggleComplete(todo.id); }}>
            <RotateCcw size={12} />
          </button>
        )}
        <button
          className="del"
          data-tooltip="删除规划事项"
          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>

    <ConfirmDialog
      isOpen={showDeleteConfirm}
      title="删除规划事项"
      message={todo
        ? `确定要删除「${plan.title}」吗？它已转成的待办会保留在待办列表里。`
        : `确定要删除「${plan.title}」吗？`}
      confirmLabel="删除"
      onConfirm={handleDelete}
      onCancel={() => setShowDeleteConfirm(false)}
    />
    </>
  );
}

/* ===== 一个分类 = 一列 ===== */

interface PlanColumnProps {
  categoryId: string;
  projectTone: string;
}

function PlanColumn({ categoryId, projectTone }: PlanColumnProps) {
  const { categories, plans, addPlan } = usePlanStore();
  const { todos } = useTodoStore();
  const showCompletedPlans = useUIStore(state => state.showCompletedPlans);
  const category = categories.find(c => c.id === categoryId);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: dragId.category(category?.projectId ?? '', categoryId) });
  // 空列也要能接住拖过来的卡片
  const { setNodeRef: setDropRef } = useDroppable({ id: dragId.planColumn(categoryId) });

  if (!category) return null;

  const columnPlans = filterVisiblePlans(
    plans.filter(p => p.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder),
    todos,
    showCompletedPlans
  );

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addPlan(category.projectId, category.id, newTitle.trim());
    setNewTitle('');
  };

  return (
    <div
      ref={setNodeRef}
      className={clsx('col plan-col', isDragging && 'is-dragging')}
      style={{
        '--proj-color': projectTone,
        transform: CSS.Transform.toString(transform),
        transition,
      } as React.CSSProperties}
    >
      <header className="col-head col-drag" {...attributes} {...listeners}>
        <span className="ind" style={{ background: projectTone }} />
        <span className="lab">{category.name}</span>
        <span className="cnt">{columnPlans.length}</span>
        <button
          className="add"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setIsAdding(true)}
          aria-label="添加规划事项"
        >
          <Plus size={14} />
        </button>
      </header>

      <div className="col-body" ref={setDropRef}>
        <SortableContext
          items={columnPlans.map(p => dragId.plan(p.id))}
          strategy={verticalListSortingStrategy}
        >
          {columnPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} projectTone={projectTone} />
          ))}
        </SortableContext>

        {isAdding ? (
          <div className="plan-add-input">
            <input
              autoFocus
              value={newTitle}
              placeholder="输入规划事项"
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewTitle('');
                }
              }}
              onBlur={() => {
                if (!newTitle.trim()) setIsAdding(false);
              }}
            />
          </div>
        ) : columnPlans.length === 0 ? (
          <button className="empty-col w-full block" onClick={() => setIsAdding(true)}>
            点击 + 添加规划事项
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ===== 末尾的「添加分类」列 —— 建的是 L2 事项分类标签 ===== */

interface AddColumnProps {
  projectId: string;
  isFirst: boolean;
}

function AddColumn({ projectId, isFirst }: AddColumnProps) {
  const { addCategory } = usePlanStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    const next = name.trim();
    if (!next) return;
    addCategory(projectId, next);
    setName('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <div className="col plan-col col-adding">
        <header className="col-head">
          <span className="ind" />
          <input
            autoFocus
            className="col-add-field"
            value={name}
            placeholder="输入分类名称"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setIsAdding(false); setName(''); }
            }}
            onBlur={() => { if (!name.trim()) setIsAdding(false); }}
          />
        </header>
      </div>
    );
  }

  return (
    <button className="plan-col-add" onClick={() => setIsAdding(true)}>
      <Plus size={16} />
      <span className="t">添加分类</span>
      {isFirst && <span className="d">该项目还没有分类，加一个就会多出一列</span>}
    </button>
  );
}

/* ===== 一个项目面板（占满整屏） ===== */

interface ProjectBoardProps {
  project: Project;
}

function ProjectBoard({ project }: ProjectBoardProps) {
  const { categories, plans } = usePlanStore();
  const { todos } = useTodoStore();
  const { openNewBoardModal } = useUIStore();

  const projectTone = TAG_TONES[project.tone] || TAG_TONES.teal;

  const projectCategories = project.categoryIds
    .map(id => categories.find(c => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const projectPlans = plans.filter(p => p.projectId === project.id);
  const linkedPlans = projectPlans.filter(p => p.todoId);
  const donePlans = linkedPlans.filter(p => todos.find(t => t.id === p.todoId)?.status === 'done');
  const percent = projectPlans.length
    ? Math.round((donePlans.length / projectPlans.length) * 100)
    : 0;

  return (
    <section className="pb-board" style={{ '--proj-color': projectTone } as React.CSSProperties}>
      <header className="pb-board-head">
        <span className="pb-dot" />
        <span className="pb-name">{project.name}</span>
        <span className="pb-cnt">{projectCategories.length} 个分类 · {projectPlans.length} 个规划事项</span>
        <div className="pb-progress">
          <div className="pb-bar"><i style={{ width: `${percent}%` }} /></div>
          <span className="pb-pct">{percent}%</span>
        </div>
        <span className="pb-stats">
          <span><b style={{ color: 'var(--warn)' }}>{linkedPlans.length}</b> 已转待办</span>
          <span><b style={{ color: 'var(--brand)' }}>{donePlans.length}</b> 已完成</span>
        </span>
        <ShowCompletedToggle />
        <button className="this-month pb-new" onClick={openNewBoardModal}>
          <Plus size={12} />
          新建项目面板
        </button>
      </header>

      <div className="kanban kanban-flow">
        <SortableContext
          items={projectCategories.map(cat => dragId.category(project.id, cat.id))}
          strategy={horizontalListSortingStrategy}
        >
          {projectCategories.map(cat => (
            <PlanColumn key={cat.id} categoryId={cat.id} projectTone={projectTone} />
          ))}
        </SortableContext>
        <AddColumn projectId={project.id} isFirst={projectCategories.length === 0} />
      </div>
    </section>
  );
}

/* ===== 视图入口 ===== */

export function ProjectBoardView() {
  const { openNewBoardModal } = useUIStore();
  const { activeProject } = useActiveBoardProject();

  if (!activeProject) {
    return (
      <div className="pb-view">
        <button className="pb-placeholder" onClick={openNewBoardModal}>
          <FolderKanban size={22} />
          <span className="t">还没有项目</span>
          <span className="d">新建一个项目，或者先到「月度规划」里建好项目和分类</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pb-view">
      <ProjectBoard key={activeProject.id} project={activeProject} />
    </div>
  );
}
