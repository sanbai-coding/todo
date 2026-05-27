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
  globalTags: string[];
  fetchFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  addTodo: (input: CreateTodoInput) => string;
  updateTodo: (id: string, input: Partial<Omit<Todo, 'id' | 'createdAt'>> & { planId?: string }) => void;
  deleteTodo: (id: string) => void;
  toggleComplete: (id: string) => void;
  clearCompleted: () => void;
  reorderTodos: (activeId: string, overId: string) => void;
  moveTodoToStatus: (id: string, status: TodoStatus) => void;
  moveTodoToQuadrant: (id: string, quadrant: Quadrant) => void;
  moveTodoToDate: (id: string, dueDate: string | undefined) => void;
  
  // Tag management
  addGlobalTag: (tag: string) => void;
  deleteGlobalTag: (tag: string) => void;
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
      globalTags: [],

      // Sync methods
      fetchFromCloud: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const cloudData = await cloudApi.fetchTodos(user.id);
        if (cloudData) {
          set({ 
            todos: cloudData.todos || [],
            globalTags: cloudData.tags || []
          });
        }
      },
      syncToCloud: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const { todos, globalTags } = get();
        await cloudApi.syncTodos(user.id, todos, globalTags);
      },

      addTodo: (input) => {
        const newId = nanoid();
        set((state) => {
          const now = new Date().toISOString();
          const newTodo: Todo = {
            id: newId,
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
        return newId;
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

      deleteTodo: (id) => {
        set((state) => {
          state.todos = state.todos.filter(t => t.id !== id);
        });
        triggerSync();
      },

      toggleComplete: (id) => {
        set((state) => {
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
        });
        triggerSync();
      },

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

      addGlobalTag: (tag) => {
        set((state) => {
          if (!state.globalTags.includes(tag)) {
            state.globalTags.push(tag);
          }
        });
        triggerSync();
      },

      deleteGlobalTag: (tag) => {
        set((state) => {
          state.globalTags = state.globalTags.filter(t => t !== tag);
          // Also remove it from all todos
          state.todos.forEach(todo => {
            if (todo.tags.includes(tag)) {
              todo.tags = todo.tags.filter(t => t !== tag);
            }
          });
        });
        triggerSync();
      },
    })),
    {
      name: 'zhouzhou-storage',
      partialize: (state) => ({ todos: state.todos, globalTags: state.globalTags }),
    }
  )
);
