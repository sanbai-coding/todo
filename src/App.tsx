import { useState, useEffect } from 'react';
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors,
  pointerWithin, rectIntersection
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TodoModal } from './components/todo/TodoModal';
import { TodoListModal } from './components/todo/TodoListModal';
import { TagModal } from './components/todo/TagModal';
import { DragOverlayContent } from './components/dnd/DragOverlayContent';
import { TimelineView } from './components/views/TimelineView/TimelineView';
import { StatusView } from './components/views/StatusView/StatusView';
import { CalendarView } from './components/views/CalendarView/CalendarView';
import { QuadrantView } from './components/views/QuadrantView/QuadrantView';
import { MonthPlanView, NewTagModal } from './components/views/MonthPlanView';
import { ProjectBoardView, NewProjectModal } from './components/views/ProjectBoardView';
import { StatsView } from './components/views/StatsView';
import { AuthModal } from './components/auth/AuthModal';
import { useTodoStore } from './store/todoStore';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { usePlanStore } from './store/planStore';
import { generateAIPMData } from './utils/mockDataGenerator';
import { cloudApi } from './api';
import type { TodoStatus, Quadrant } from './types';
import { dragId, parseDragId } from './utils/dndUtils';

function App() {
  const [activeDragItem, setActiveDragItem] = useState<{ id: string, type: 'todo' | 'project' | 'category' | 'plan' } | null>(null);
  const { todos, reorderTodos, moveTodoToStatus, moveTodoToQuadrant, moveTodoToDate } = useTodoStore();
  const { reorderProjects, reorderCategories, movePlan } = usePlanStore();
  const { currentView, isDarkMode, toastMessage, isTagModalOpen } = useUIStore();
  const user = useAuthStore(state => state.user);

  // Track views
  useEffect(() => {
    if (user) {
      cloudApi.trackEvent(user.id, `view_${currentView}`);
    }
  }, [currentView, user]);

  useEffect(() => {
    if (user && isTagModalOpen) {
      cloudApi.trackEvent(user.id, 'view_tag_modal');
    }
  }, [isTagModalOpen, user]);

  useEffect(() => {
    if (user?.email === '1067363705@qq.com') {
      const genKey = `hasGeneratedAIPMData_v2_${user.email}`;
      if (!localStorage.getItem(genKey)) {
        generateAIPMData();
        localStorage.setItem(genKey, 'true');
        useUIStore.getState().showToast('已为您自动生成 AI产品经理 的演示数据！');
      }
    }
  }, [user?.email]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Cloud reads only ever happened at login - two open tabs/devices never
  // saw each other's edits until someone logged out and back in. Poll
  // periodically and re-pull whenever the tab regains focus so changes made
  // elsewhere show up without requiring a manual re-login.
  useEffect(() => {
    if (!user) return;
    const pullFromCloud = () => {
      useTodoStore.getState().fetchFromCloud();
      usePlanStore.getState().fetchFromCloud();
    };
    pullFromCloud();
    const interval = setInterval(pullFromCloud, 20000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') pullFromCloud();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', pullFromCloud);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', pullFromCloud);
    };
  }, [user]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // Handle standalone stats view
  if (window.location.search.includes('view=stats')) {
    return <StatsView />;
  }

  // All data lives in the cloud now - require login before showing the app
  // so nothing is ever created in a state where it can't be synced.
  if (!user) {
    return <AuthModal forceOpen />;
  }

  const activeTodo = activeDragItem?.type === 'todo' ? todos.find(t => t.id === activeDragItem.id) : null;
  const activeProject = activeDragItem?.type === 'project' ? usePlanStore.getState().projects.find(p => dragId.project(p.id) === activeDragItem.id) : null;
  const activeCategory = activeDragItem?.type === 'category' ? usePlanStore.getState().categories.find(c => dragId.category(c.projectId, c.id) === activeDragItem.id) : null;
  const activePlan = activeDragItem?.type === 'plan' ? usePlanStore.getState().plans.find(p => dragId.plan(p.id) === activeDragItem.id) : null;

  const customCollisionDetection = (args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const id = active.id as string;
    const parsed = parseDragId(id);
    if (parsed?.kind === 'project') {
      setActiveDragItem({ id, type: 'project' });
    } else if (parsed?.kind === 'category') {
      setActiveDragItem({ id, type: 'category' });
    } else if (parsed?.kind === 'plan') {
      setActiveDragItem({ id, type: 'plan' });
    } else {
      setActiveDragItem({ id, type: 'todo' });
    }
  };

  // 规划事项换列时，它转出去的待办身上带的还是旧分类名，顺手换成新分类名，
  // 否则按标签筛选会把它归到原来的分类里。
  const syncPlanTodoTag = (planId: string, targetCategoryId: string) => {
    const { plans, categories } = usePlanStore.getState();
    const plan = plans.find(p => p.id === planId);
    if (!plan?.todoId || plan.categoryId === targetCategoryId) return;
    const from = categories.find(c => c.id === plan.categoryId);
    const to = categories.find(c => c.id === targetCategoryId);
    if (!from || !to) return;
    const todo = useTodoStore.getState().todos.find(t => t.id === plan.todoId);
    if (!todo || !todo.tags.includes(from.name)) return;
    const tags = Array.from(new Set(todo.tags.map(t => (t === from.name ? to.name : t))));
    useTodoStore.getState().updateTodo(todo.id, { tags });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragItem(null);
    if (!over || active.id === over.id) return;

    const overId = over.id as string;
    const activeId = active.id as string;
    const activeParsed = parseDragId(activeId);
    const overParsed = parseDragId(overId);

    if (activeParsed?.kind === 'project') {
      if (overParsed?.kind === 'project') {
        reorderProjects(activeParsed.parts[0], overParsed.parts[0]);
      }
      return;
    }

    if (activeParsed?.kind === 'category') {
      const [activeProjId, activeCatId] = activeParsed.parts;
      if (overParsed?.kind === 'category') {
        const [overProjId, overCatId] = overParsed.parts;
        if (activeProjId === overProjId) {
          reorderCategories(activeProjId, activeCatId, overCatId);
        }
      }
      return;
    }

    // 规划事项：落在另一条事项上就插到它前面，落在列上就追加到列尾
    if (activeParsed?.kind === 'plan') {
      const planId = activeParsed.parts[0];
      if (overParsed?.kind === 'plan') {
        const overPlanId = overParsed.parts[0];
        const targetCategoryId = usePlanStore.getState().plans.find(p => p.id === overPlanId)?.categoryId;
        if (targetCategoryId) {
          syncPlanTodoTag(planId, targetCategoryId);
          movePlan(planId, targetCategoryId, overPlanId);
        }
      } else if (overParsed?.kind === 'planColumn') {
        const targetCategoryId = overParsed.parts[0];
        syncPlanTodoTag(planId, targetCategoryId);
        movePlan(planId, targetCategoryId);
      }
      return;
    }

    if (overId.startsWith('status-column-')) {
      const status = overId.replace('status-column-', '') as TodoStatus;
      moveTodoToStatus(activeId, status);
      return;
    }

    if (overId.startsWith('quadrant-cell-')) {
      const quadrant = overId.replace('quadrant-cell-', '') as Quadrant;
      moveTodoToQuadrant(activeId, quadrant);
      return;
    }

    if (overId.startsWith('timeline-date-')) {
      const dateStr = overId.replace('timeline-date-', '');
      if (dateStr !== 'overdue') {
        moveTodoToDate(activeId, dateStr);
      }
      return;
    }

    const overTodo = todos.find(t => t.id === overId);
    if (overTodo) {
      if (currentView === 'status' && activeTodo?.status !== overTodo.status) {
        moveTodoToStatus(activeId, overTodo.status);
      } else if (currentView === 'quadrant' && activeTodo?.quadrant !== overTodo.quadrant) {
        moveTodoToQuadrant(activeId, overTodo.quadrant as Quadrant);
      } else if (currentView === 'calendar' && activeTodo?.dueDate !== overTodo.dueDate) {
        moveTodoToDate(activeId, overTodo.dueDate as string);
      } else if (currentView === 'timeline' && activeTodo?.dueDate !== overTodo.dueDate) {
        moveTodoToDate(activeId, overTodo.dueDate as string);
      }
      reorderTodos(activeId, overId);
    }
  };

  const VIEW_COMPONENTS: Record<string, React.ReactNode> = {
    timeline: <TimelineView />,
    status: <StatusView />,
    calendar: <CalendarView />,
    quadrant: <QuadrantView />,
    monthPlan: <MonthPlanView />,
    projectBoard: <ProjectBoardView />,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="app">
        <Sidebar />
        <div className="main">
          <Header />
          {VIEW_COMPONENTS[currentView]}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeTodo && <DragOverlayContent todo={activeTodo} />}
        {activeProject && (
          <div className="proj-col opacity-80 scale-105 shadow-xl bg-[var(--surface)] p-3 rounded-xl border-2 border-[var(--brand)]">
            <header className="proj-head">
              <span className="pname font-bold">{activeProject.name}</span>
            </header>
          </div>
        )}
        {activeCategory && (
          <div className="cat opacity-80 scale-105 shadow-xl bg-[var(--surface)] p-2 rounded-lg border-2 border-[var(--brand)]">
            <div className="cat-head">
              <span className="cname font-medium">{activeCategory.name}</span>
            </div>
          </div>
        )}
        {activePlan && (
          <div className="drag-plan-ghost">{activePlan.title}</div>
        )}
      </DragOverlay>

      <TodoModal />
      <TodoListModal />
      <TagModal />
      <NewTagModal />
      <NewProjectModal />
      <AuthModal />
      
      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] px-4 py-2 bg-[var(--surface)] text-[var(--ink-1)] border border-[var(--line)] rounded-md shadow-lg font-medium text-sm animate-fade-in">
          {toastMessage}
        </div>
      )}
    </DndContext>
  );
}

export default App;
