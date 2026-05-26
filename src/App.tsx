import { useState, useEffect } from 'react';
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor, useSensor, useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TodoModal } from './components/todo/TodoModal';
import { TodoListModal } from './components/todo/TodoListModal';
import { DragOverlayContent } from './components/dnd/DragOverlayContent';
import { TimelineView } from './components/views/TimelineView/TimelineView';
import { StatusView } from './components/views/StatusView/StatusView';
import { CalendarView } from './components/views/CalendarView/CalendarView';
import { QuadrantView } from './components/views/QuadrantView/QuadrantView';
import { AuthPage } from './components/auth/AuthPage';
import { useAuthStore } from './store/authStore';
import { useTodoStore } from './store/todoStore';
import { useUIStore } from './store/uiStore';
import type { TodoStatus, Quadrant } from './types';

function App() {
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { todos, reorderTodos, moveTodoToStatus, moveTodoToQuadrant, moveTodoToDate } = useTodoStore();
  const { currentView, isDarkMode } = useUIStore();

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

  const activeTodo = activeTodoId ? todos.find(t => t.id === activeTodoId) : null;

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

    if (todos.find(t => t.id === overId)) {
      reorderTodos(activeId, overId);
    }
  };

  const VIEW_COMPONENTS: Record<string, React.ReactNode> = {
    timeline: <TimelineView />,
    status: <StatusView />,
    calendar: <CalendarView />,
    quadrant: <QuadrantView />,
  };

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
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
    </DndContext>
  );
}

export default App;
