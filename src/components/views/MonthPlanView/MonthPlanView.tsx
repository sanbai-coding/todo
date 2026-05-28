import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Zap, Edit2, RotateCcw } from 'lucide-react';
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlanStore } from '../../../store/planStore';
import { useTodoStore } from '../../../store/todoStore';
import { useUIStore } from '../../../store/uiStore';
import { TAG_TONES } from '../../../types';
import { clsx } from 'clsx';
import { format, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PlanItemProps {
  plan: ReturnType<typeof usePlanStore.getState>['plans'][number];
  projectTone: string;
}

function PlanItem({ plan, projectTone }: PlanItemProps) {
  const { updatePlan, categories } = usePlanStore();
  const { todos, addTodo, toggleComplete, updateTodo } = useTodoStore();
  const todo = plan.todoId ? todos.find(t => t.id === plan.todoId) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(plan.title);

  const getCategoryName = () => {
    const category = categories.find(c => c.id === plan.categoryId);
    return category?.name;
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const categoryName = getCategoryName();
    const todoId = addTodo({
      title: plan.title,
      dueDate: todayStr,
      status: 'todo',
      priority: 'none',
      quadrant: 'not_important_not_urgent',
      tags: categoryName ? [categoryName] : [],
      planId: plan.id,
    } as any);
    updatePlan(plan.id, { todoId });
    useUIStore.getState().showToast('已经设为今日待办');
  };

  const handleSetTodo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const categoryName = getCategoryName();
    useUIStore.getState().openCreateModal(
      undefined, 
      undefined, 
      undefined, 
      plan.title, 
      plan.id, 
      categoryName ? [categoryName] : undefined
    );
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (todo) {
      toggleComplete(todo.id);
    }
  };



  const submitEdit = () => {
    if (editTitle.trim() && editTitle !== plan.title) {
      updatePlan(plan.id, { title: editTitle.trim() });
      if (todo) {
        updateTodo(todo.id, { title: editTitle.trim() });
      }
    } else {
      setEditTitle(plan.title);
    }
    setIsEditing(false);
  };

  const stateClass = todo ? `s-${todo.status}` : '';
  const hasTodo = !!todo;

  const formatDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = format(new Date(), 'yyyy-MM-dd');
    if (dueDate === today) return '今日';
    return format(new Date(dueDate), 'M/d');
  };

  return (
    <div
      className={clsx('plan', hasTodo && 'has-todo', stateClass)}
      style={{ '--proj-color': projectTone } as React.CSSProperties}
      onClick={(e) => {
        if (!isEditing && !e.defaultPrevented) {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {!hasTodo && (
        <span className={clsx('pri-dot')} />
      )}
      {hasTodo && (
        <span className={clsx('pri-dot', todo.priority !== 'none' && todo.priority)} />
      )}
      
      {isEditing ? (
        <input
          autoFocus
          className="flex-1 bg-transparent outline-none text-[13px] px-1"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={submitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEdit();
            if (e.key === 'Escape') {
              setEditTitle(plan.title);
              setIsEditing(false);
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      ) : (
        <span className="ptxt">{plan.title}</span>
      )}
      {todo && todo.dueDate && (
        <span className="due">{formatDue(todo.dueDate)}</span>
      )}
      {todo && (
        <span className={clsx('plan-state', todo.status === 'in_progress' ? 's-doing' : `s-${todo.status}`)}>
          {todo.status === 'todo' && '未开始'}
          {todo.status === 'in_progress' && '进行中'}
          {todo.status === 'done' && '已完成'}
          {todo.status === 'cancelled' && '已取消'}
        </span>
      )}
      <span className="plan-actions relative">
        {!hasTodo && (
          <button
            className="today"
            data-tooltip="设为今日待办"
            onClick={handleSetToday}
          >
            <Zap size={13} />
          </button>
        )}
        {!hasTodo && (
          <button
            className="edit-todo"
            data-tooltip="设为待办"
            onClick={handleSetTodo}
          >
            <Edit2 size={13} />
          </button>
        )}
        {todo && todo.status === 'done' && (
          <button
            data-tooltip="取消完成"
            onClick={handleToggleComplete}
          >
            <RotateCcw size={13} />
          </button>
        )}
      </span>
    </div>
  );
}

interface CategorySectionProps {
  categoryId: string;
  projectTone: string;
}

function CategorySection({ categoryId, projectTone }: CategorySectionProps) {
  const { categories, plans, toggleCategoryOpen, addPlan, updateCategory } = usePlanStore();
  const category = categories.find(c => c.id === categoryId);
  const categoryPlans = plans.filter(p => p.categoryId === categoryId);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category?.name || '');

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: `category-${category?.projectId}-${categoryId}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!category) return null;

  const handleAddPlan = () => {
    if (newPlanTitle.trim()) {
      addPlan(category.projectId, category.id, newPlanTitle.trim());
      setNewPlanTitle('');
      setIsAdding(false);
    }
  };

  const submitEdit = () => {
    if (editName.trim() && editName !== category.name) {
      updateCategory(category.id, { name: editName.trim() });
    } else {
      setEditName(category.name);
    }
    setIsEditing(false);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={clsx("cat", isDragging && "opacity-50")}
    >
      <div
        className="cat-head"
        data-open={category.isOpen}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (!isEditing && !e.defaultPrevented) {
            e.preventDefault();
            // Click to toggle open
            toggleCategoryOpen(category.id);
          }
        }}
        onDoubleClick={(e) => {
          if (!isEditing && !e.defaultPrevented) {
            e.preventDefault();
            setIsEditing(true);
          }
        }}
      >
        <span className="caret">
          <ChevronDown size={10} />
        </span>
        {isEditing ? (
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none font-medium px-1 text-[13px]"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={submitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitEdit();
              if (e.key === 'Escape') {
                setEditName(category.name);
                setIsEditing(false);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        ) : (
          <span 
            className="cname cursor-text"
            onClick={(e) => {
              if (!isEditing && !e.defaultPrevented) {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }
            }}
          >
            {category.name}
          </span>
        )}
        <span className="ccnt">{categoryPlans.length}</span>
        <button
          className="cadd"
          onClick={(e) => {
            e.stopPropagation();
            setIsAdding(true);
          }}
        >
          <Plus size={11} />
        </button>
      </div>
      {category.isOpen && (
        <div className="plan-list">
          {categoryPlans.map(plan => (
            <PlanItem key={plan.id} plan={plan} projectTone={projectTone} />
          ))}
          {isAdding ? (
            <div className="plan-add-input">
              <input
                type="text"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPlan();
                  if (e.key === 'Escape') {
                    setIsAdding(false);
                    setNewPlanTitle('');
                  }
                }}
                onBlur={() => {
                  if (!newPlanTitle.trim()) {
                    setIsAdding(false);
                  }
                }}
                placeholder="输入计划名称"
                autoFocus
              />
            </div>
          ) : (
            <button className="plan-add" onClick={() => setIsAdding(true)}>
              <Plus size={12} />
              添加计划
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ProjectColumnProps {
  projectId: string;
}

function ProjectColumn({ projectId }: ProjectColumnProps) {
  const { projects, categories, addCategory, updateProject } = usePlanStore();
  const project = projects.find(p => p.id === projectId);
  const projectCategories = (project?.categoryIds || [])
    .map(id => categories.find(c => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project?.name || '');

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: `project-${projectId}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!project) return null;

  const projectTone = TAG_TONES[project.tone] || TAG_TONES.teal;

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(project.id, newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const submitEdit = () => {
    if (editName.trim() && editName !== project.name) {
      updateProject(project.id, { name: editName.trim() });
    } else {
      setEditName(project.name);
    }
    setIsEditing(false);
  };

  const totalPlans = projectCategories.reduce((acc, cat) => acc + cat.planIds.length, 0);

  return (
    <div
      ref={setNodeRef}
      className={clsx("proj-col", isDragging && "opacity-50")}
      style={{ '--proj-color': projectTone, ...style } as React.CSSProperties}
    >
      <header 
        className="proj-head"
        {...attributes}
        {...listeners}
      >
        {isEditing ? (
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none font-bold px-1"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={submitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitEdit();
              if (e.key === 'Escape') {
                setEditName(project.name);
                setIsEditing(false);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        ) : (
          <span 
            className="pname cursor-text"
            onClick={(e) => {
              if (!isEditing && !e.defaultPrevented) {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }
            }}
          >
            {project.name}
          </span>
        )}
        <span className="pcnt">{totalPlans}</span>
        <div className="pact">
          <button
            title="添加分类"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingCategory(true);
            }}
          >
            <Plus size={13} />
          </button>
        </div>
      </header>
      <div className="proj-body">
        <SortableContext items={project.categoryIds.map(id => `category-${project.id}-${id}`)} strategy={verticalListSortingStrategy}>
          {projectCategories.map(cat => (
            <CategorySection key={cat.id} categoryId={cat.id} projectTone={projectTone} />
          ))}
        </SortableContext>
        {isAddingCategory ? (
          <div className="cat-add-input">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
                if (e.key === 'Escape') {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }
              }}
              onBlur={() => {
                if (!newCategoryName.trim()) {
                  setIsAddingCategory(false);
                }
              }}
              placeholder="输入分类名称"
              autoFocus
            />
          </div>
        ) : (
          <button className="cat-add" onClick={() => setIsAddingCategory(true)}>
            <Plus size={12} />
            <span>添加分类</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function MonthPlanView() {
  const { projects } = usePlanStore();
  const { openNewTagModal } = useUIStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToCurrentMonth = () => setCurrentDate(new Date());

  const monthLabel = format(currentDate, 'M月', { locale: zhCN });
  const yearLabel = format(currentDate, 'yyyy年', { locale: zhCN });

  const isCurrentMonth = format(currentDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  const totalProjects = projects.length;
  const totalPlans = projects.reduce((acc, p) => {
    return acc + p.categoryIds.reduce((catAcc, catId) => {
      const cat = usePlanStore.getState().categories.find(c => c.id === catId);
      return catAcc + (cat?.planIds.length || 0);
    }, 0);
  }, 0);
  const syncedTodos = projects.reduce((acc, p) => {
    return acc + p.categoryIds.reduce((catAcc, catId) => {
      const cat = usePlanStore.getState().categories.find(c => c.id === catId);
      return catAcc + (cat?.planIds.filter(planId => {
        const plan = usePlanStore.getState().plans.find(p => p.id === planId);
        return plan?.todoId;
      }).length || 0);
    }, 0);
  }, 0);
  const doneTodos = projects.reduce((acc, p) => {
    return acc + p.categoryIds.reduce((catAcc, catId) => {
      const cat = usePlanStore.getState().categories.find(c => c.id === catId);
      return catAcc + (cat?.planIds.filter(planId => {
        const plan = usePlanStore.getState().plans.find(p => p.id === planId);
        if (!plan?.todoId) return false;
        const todo = useTodoStore.getState().todos.find(t => t.id === plan.todoId);
        return todo?.status === 'done';
      }).length || 0);
    }, 0);
  }, 0);

  return (
    <div className="month-plan-view">
      <div className="month-head">
        <div className="mnav">
          <button onClick={goToPrevMonth}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={goToNextMonth}>
            <ChevronRight size={14} />
          </button>
        </div>
        <button className="mo">
          <span className="m">{monthLabel}</span>
          <span className="y">{yearLabel}</span>
          <ChevronDown size={13} />
        </button>
        {!isCurrentMonth && (
          <button className="this-month" onClick={goToCurrentMonth}>
            本月
          </button>
        )}
        <div className="month-stats">
          <span className="ms"><b>{totalProjects}</b>项目</span>
          <span className="ms"><b>{totalPlans}</b>计划</span>
          <span className="ms"><b style={{ color: 'var(--warn)' }}>{syncedTodos}</b>已转待办</span>
          <span className="ms"><b style={{ color: 'var(--brand)' }}>{doneTodos}</b>已完成</span>
          <button className="this-month" onClick={() => openNewTagModal()}>
            <Plus size={12} />
            新建标签
          </button>
        </div>
      </div>

      <div className="month-board">
        <SortableContext items={projects.map(p => `project-${p.id}`)} strategy={horizontalListSortingStrategy}>
          {projects.map(project => (
            <ProjectColumn key={project.id} projectId={project.id} />
          ))}
        </SortableContext>
        
        <button 
          className="proj-add"
          onClick={() => openNewTagModal()}
        >
          <Plus size={18} />
          <span>添加项目</span>
        </button>
      </div>
    </div>
  );
}