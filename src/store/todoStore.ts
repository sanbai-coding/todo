import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { arrayMove } from '@dnd-kit/sortable';
import type { Todo, CreateTodoInput, TodoStatus, Quadrant } from '../types';
import { getNextSortOrder } from '../utils/todoUtils';
import { cloudApi } from '../api';
import { useAuthStore } from './authStore';

interface TodoState {
  todos: Todo[];
  fetchFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  addTodo: (input: CreateTodoInput) => void;
  updateTodo: (id: string, input: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  deleteTodo: (id: string) => void;
  toggleComplete: (id: string) => void;
  clearCompleted: () => void;
  reorderTodos: (activeId: string, overId: string) => void;
  moveTodoToStatus: (id: string, status: TodoStatus) => void;
  moveTodoToQuadrant: (id: string, quadrant: Quadrant) => void;
  moveTodoToDate: (id: string, dueDate: string | undefined) => void;
}

// Helper to trigger sync
const triggerSync = () => {
  const user = useAuthStore.getState().user;
  if (user) {
    useTodoStore.getState().syncToCloud();
  }
};

export const useTodoStore = create<TodoState>()(
  persist(
    immer((set, get) => ({
      todos: [],

      // Sync methods
      fetchFromCloud: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const cloudTodos = await cloudApi.fetchTodos(user.id);
        if (cloudTodos && cloudTodos.length > 0) {
          set({ todos: cloudTodos });
        }
      },
      syncToCloud: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const { todos } = get();
        await cloudApi.syncTodos(user.id, todos);
      },

      addTodo: (input) => {
        set((state) => {
          const now = new Date().toISOString();
          const newTodo: Todo = {
            id: nanoid(),
            createdAt: now,
            updatedAt: now,
            ...input,
            status: input.status || 'todo',
            priority: input.priority || 'medium',
            quadrant: input.quadrant || 'important_urgent',
            sortOrder: input.sortOrder || getNextSortOrder(state.todos as Todo[]),
          };
          state.todos.push(newTodo as any);
        });
        triggerSync();
      },

      updateTodo: (id, input) => {
        set((state) => {
          const todo = state.todos.find(t => t.id === id);
          if (!todo) return;
          Object.assign(todo, input);
          todo.updatedAt = new Date().toISOString();
          if (input.status === 'done' && !todo.completedAt) {
            todo.completedAt = new Date().toISOString();
          } else if (input.status && input.status !== 'done') {
            todo.completedAt = undefined;
          }
        });
        triggerSync();
      },

      deleteTodo: (id) => set((state) => {
        state.todos = state.todos.filter(t => t.id !== id);
      }),

      toggleComplete: (id) => set((state) => {
        const todo = state.todos.find(t => t.id === id);
        if (!todo) return;
        const now = new Date().toISOString();
        if (todo.status === 'done') {
          todo.status = 'todo';
          todo.completedAt = undefined;
        } else {
          todo.status = 'done';
          todo.completedAt = now;
        }
        todo.updatedAt = now;
      }),

      clearCompleted: () => {
        set((state) => {
          state.todos = state.todos.filter(t => t.status !== 'done');
        });
        triggerSync();
      },

      reorderTodos: (activeId, overId) => {
        set((state) => {
          const activeIndex = state.todos.findIndex(t => t.id === activeId);
          const overIndex = state.todos.findIndex(t => t.id === overId);
          if (activeIndex === -1 || overIndex === -1) return;
          state.todos = arrayMove(state.todos as Todo[], activeIndex, overIndex);
          state.todos.forEach((todo, i) => {
            todo.sortOrder = (i + 1) * 1000;
          });
        });
        triggerSync();
      },

      moveTodoToStatus: (id, status) => {
        set((state) => {
          const todo = state.todos.find(t => t.id === id);
          if (!todo) return;
          todo.status = status;
          todo.updatedAt = new Date().toISOString();
          if (status === 'done' && !todo.completedAt) {
            todo.completedAt = new Date().toISOString();
          } else if (status !== 'done') {
            todo.completedAt = undefined;
          }
          const sameStatusTodos = state.todos.filter(t => t.status === status);
          todo.sortOrder = getNextSortOrder(sameStatusTodos as Todo[]);
        });
        triggerSync();
      },

      moveTodoToQuadrant: (id, quadrant) => {
        set((state) => {
          const todo = state.todos.find(t => t.id === id);
          if (!todo) return;
          todo.quadrant = quadrant;
          todo.updatedAt = new Date().toISOString();
        });
        triggerSync();
      },

      moveTodoToDate: (id, dueDate) => {
        set((state) => {
          const todo = state.todos.find(t => t.id === id);
          if (!todo) return;
          todo.dueDate = dueDate;
          todo.updatedAt = new Date().toISOString();
        });
        triggerSync();
      },
    })),
    {
      name: 'zhouzhou-storage',
      // We still keep local persist, but the app can call fetchFromCloud on load
      partialize: (state) => ({ todos: state.todos }),
    }
  )
);
