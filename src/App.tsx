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
import type { TodoStatus, Quadrant } from './types';

function App() {
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const { todos, reorderTodos, moveTodoToStatus, moveTodoToQuadrant, moveTodoToDate } = useTodoStore();
  const { currentView, isDarkMode, toastMessage } = useUIStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // 临时：为用户生成逾期预览数据
    if (!localStorage.getItem('hasGeneratedMockOverdue_v1')) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      
      useTodoStore.getState().addTodo({
        title: '整理上个月的发票报销（演示数据）',
        status: 'todo',
        priority: 'high',
        quadrant: 'important_urgent',
        dueDate: lastWeek,
        tags: [],
        sortOrder: 0,
      });

      useTodoStore.getState().addTodo({
        title: '更新系统安全证书（演示数据）',
        status: 'in_progress',
        priority: 'medium',
        quadrant: 'important_not_urgent',
        dueDate: yesterday,
        tags: [],
        sortOrder: 0,
      });
      
      localStorage.setItem('hasGeneratedMockOverdue_v1', 'true');
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const activeTodo = activeTodoId ? todos.find(t => t.id === activeTodoId) : null;

  const customCollisionDetection = (args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTodoId(active.id as string);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTodoId(null);
    if (!over || active.id === over.id) return;

    const overId = over.id as string;
    const activeId = active.id as string;

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
