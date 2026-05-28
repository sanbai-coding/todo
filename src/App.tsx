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
import { AuthModal } from './components/auth/AuthModal';
import { useTodoStore } from './store/todoStore';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { usePlanStore } from './store/planStore';
import { generateAIPMData } from './utils/mockDataGenerator';
import type { TodoStatus, Quadrant } from './types';

function App() {
  const [activeDragItem, setActiveDragItem] = useState<{ id: string, type: 'todo' | 'project' | 'category' } | null>(null);
  const { todos, reorderTodos, moveTodoToStatus, moveTodoToQuadrant, moveTodoToDate } = useTodoStore();
  const { reorderProjects, reorderCategories } = usePlanStore();
  const { currentView, isDarkMode, toastMessage } = useUIStore();
  const user = useAuthStore(state => state.user);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const activeTodo = activeDragItem?.type === 'todo' ? todos.find(t => t.id === activeDragItem.id) : null;
  const activeProject = activeDragItem?.type === 'project' ? usePlanStore.getState().projects.find(p => `project-${p.id}` === activeDragItem.id) : null;
  const activeCategory = activeDragItem?.type === 'category' ? usePlanStore.getState().categories.find(c => `category-${c.projectId}-${c.id}` === activeDragItem.id) : null;

  const customCollisionDetection = (args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const id = active.id as string;
    if (id.startsWith('project-')) {
      setActiveDragItem({ id, type: 'project' });
    } else if (id.startsWith('category-')) {
      setActiveDragItem({ id, type: 'category' });
    } else {
      setActiveDragItem({ id, type: 'todo' });
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragItem(null);
    if (!over || active.id === over.id) return;

    const overId = over.id as string;
    const activeId = active.id as string;

    if (activeId.startsWith('project-') && overId.startsWith('project-')) {
      reorderProjects(activeId.replace('project-', ''), overId.replace('project-', ''));
      return;
    }

    if (activeId.startsWith('category-') && overId.startsWith('category-')) {
      const [, activeProjId, activeCatId] = activeId.split('-');
      const [, overProjId, overCatId] = overId.split('-');
      if (activeProjId === overProjId) {
        reorderCategories(activeProjId, activeCatId, overCatId);
      }
      return;
    }

    if (activeId.startsWith('project-') || activeId.startsWith('category-')) {
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
      </DragOverlay>

      <TodoModal />
      <TodoListModal />
      <TagModal />
      <NewTagModal />
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
