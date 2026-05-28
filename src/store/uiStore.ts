import { create } from 'zustand';
import type { ViewType, TodoStatus, Quadrant } from '../types';
import { getMonthStr } from '../utils/dateUtils';
import { useAuthStore } from './authStore';

export type ListModalFilter = 'pending' | 'done' | 'in_progress' | 'high_priority' | 'overdue' | null;

interface UIState {
  currentView: ViewType;
  isDarkMode: boolean;
  isModalOpen: boolean;
  isAuthModalOpen: boolean;
  isTagModalOpen: boolean;
  isNewTagModalOpen: boolean;
  editingTodoId: string | null;
  defaultDueDate: string | undefined;
  defaultStatus: TodoStatus | undefined;
  defaultQuadrant: Quadrant | undefined;
  defaultTitle: string | undefined;
  defaultPlanId: string | undefined;
  defaultTags: string[] | undefined;
  calendarCurrentMonth: string;
  selectedCalendarDate: string | null;
  searchQuery: string;
  tagFilter: string | null;
  dateFilter: 'all' | 'today';
  collapsedOverdue: boolean;
  
  listModalFilter: ListModalFilter;

  setView: (view: ViewType) => void;
  toggleDarkMode: () => void;
  openCreateModal: (defaultDate?: string, defaultStatus?: TodoStatus, defaultQuadrant?: Quadrant, defaultTitle?: string, planId?: string, defaultTags?: string[]) => void;
  openEditModal: (todoId: string) => void;
  closeModal: () => void;
  
  openAuthModal: () => void;
  closeAuthModal: () => void;

  openTagModal: () => void;
  closeTagModal: () => void;
  openNewTagModal: () => void;
  closeNewTagModal: () => void;

  openListModal: (filter: ListModalFilter) => void;
  closeListModal: () => void;

  setCalendarMonth: (month: string) => void;
  selectCalendarDate: (date: string | null) => void;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tag: string | null) => void;
  setDateFilter: (filter: 'all' | 'today') => void;
  toggleOverdue: () => void;
  
  toastMessage: string | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  currentView: 'timeline',
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  isModalOpen: false,
  isAuthModalOpen: false,
  isTagModalOpen: false,
  isNewTagModalOpen: false,
  editingTodoId: null,
  defaultDueDate: undefined,
  defaultStatus: undefined,
  defaultQuadrant: undefined,
  defaultTitle: undefined,
  defaultPlanId: undefined,
  defaultTags: undefined,
  calendarCurrentMonth: getMonthStr(new Date()),
  selectedCalendarDate: null,
  searchQuery: '',
  tagFilter: null,
  dateFilter: 'all',
  collapsedOverdue: false,
  listModalFilter: null,
  toastMessage: null,

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

  openCreateModal: (defaultDate, defaultStatus, defaultQuadrant, defaultTitle, planId, defaultTags) => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ isAuthModalOpen: true });
      return;
    }
    set({
      isModalOpen: true,
      editingTodoId: null,
      defaultDueDate: defaultDate,
      defaultStatus,
      defaultQuadrant,
      defaultTitle,
      defaultPlanId: planId,
      defaultTags,
    });
  },

  openEditModal: (todoId) => set({
    isModalOpen: true,
    editingTodoId: todoId,
    defaultDueDate: undefined,
    defaultStatus: undefined,
    defaultQuadrant: undefined,
    defaultTitle: undefined,
    defaultPlanId: undefined,
    defaultTags: undefined,
    listModalFilter: null,
  }),

  closeModal: () => set({
    isModalOpen: false,
    editingTodoId: null,
    defaultDueDate: undefined,
    defaultStatus: undefined,
    defaultQuadrant: undefined,
    defaultTitle: undefined,
    defaultPlanId: undefined,
    defaultTags: undefined,
  }),

  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  openTagModal: () => set({ isTagModalOpen: true }),
  closeTagModal: () => set({ isTagModalOpen: false }),
  openNewTagModal: () => set({ isNewTagModalOpen: true }),
  closeNewTagModal: () => set({ isNewTagModalOpen: false }),

  openListModal: (filter) => set({ listModalFilter: filter }),
  closeListModal: () => set({ listModalFilter: null }),

  setCalendarMonth: (month) => set({ calendarCurrentMonth: month }),
  selectCalendarDate: (date) => set({ selectedCalendarDate: date }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTagFilter: (tag) => set({ tagFilter: tag }),
  setDateFilter: (filter) => set({ dateFilter: filter }),
  toggleOverdue: () => set((state) => ({ collapsedOverdue: !state.collapsedOverdue })),
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },
  hideToast: () => set({ toastMessage: null }),
}));
