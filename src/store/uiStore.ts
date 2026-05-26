import { create } from 'zustand';
import type { ViewType, TodoStatus, Quadrant } from '../types';
import { getMonthStr } from '../utils/dateUtils';

export type ListModalFilter = 'pending' | 'done' | 'in_progress' | 'high_priority' | null;

interface UIState {
  currentView: ViewType;
  isDarkMode: boolean;
  isModalOpen: boolean;
  editingTodoId: string | null;
  defaultDueDate: string | undefined;
  defaultStatus: TodoStatus | undefined;
  defaultQuadrant: Quadrant | undefined;
  calendarCurrentMonth: string;
  selectedCalendarDate: string | null;
  searchQuery: string;
  collapsedOverdue: boolean;
  
  listModalFilter: ListModalFilter;

  setView: (view: ViewType) => void;
  toggleDarkMode: () => void;
  openCreateModal: (defaultDate?: string, defaultStatus?: TodoStatus, defaultQuadrant?: Quadrant) => void;
  openEditModal: (todoId: string) => void;
  closeModal: () => void;
  
  openListModal: (filter: ListModalFilter) => void;
  closeListModal: () => void;

  setCalendarMonth: (month: string) => void;
  selectCalendarDate: (date: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleOverdue: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  currentView: 'timeline',
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  isModalOpen: false,
  editingTodoId: null,
  defaultDueDate: undefined,
  defaultStatus: undefined,
  defaultQuadrant: undefined,
  calendarCurrentMonth: getMonthStr(new Date()),
  selectedCalendarDate: null,
  searchQuery: '',
  collapsedOverdue: false,
  listModalFilter: null,

  setView: (view) => set({ currentView: view }),

  toggleDarkMode: () => set((state) => {
    const next = !state.isDarkMode;
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: next };
  }),

  openCreateModal: (defaultDate, defaultStatus, defaultQuadrant) => set({
    isModalOpen: true,
    editingTodoId: null,
    defaultDueDate: defaultDate,
    defaultStatus,
    defaultQuadrant,
  }),

  openEditModal: (todoId) => set({
    isModalOpen: true,
    editingTodoId: todoId,
    defaultDueDate: undefined,
    defaultStatus: undefined,
    defaultQuadrant: undefined,
  }),

  closeModal: () => set({
    isModalOpen: false,
    editingTodoId: null,
    defaultDueDate: undefined,
    defaultStatus: undefined,
    defaultQuadrant: undefined,
  }),

  openListModal: (filter) => set({ listModalFilter: filter }),
  closeListModal: () => set({ listModalFilter: null }),

  setCalendarMonth: (month) => set({ calendarCurrentMonth: month }),
  selectCalendarDate: (date) => set({ selectedCalendarDate: date }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleOverdue: () => set((state) => ({ collapsedOverdue: !state.collapsedOverdue })),
}));
