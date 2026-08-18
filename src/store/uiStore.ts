import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  isNewBoardModalOpen: boolean;
  /** 「项目规划」当前聚焦的项目，一次只展示一个面板 */
  boardProjectId: string | null;
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
  /** 月度规划 / 项目规划里是否展示已完成（划线）的规划事项 */
  showCompletedPlans: boolean;
  
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
  openNewBoardModal: () => void;
  closeNewBoardModal: () => void;
  setBoardProject: (projectId: string | null) => void;

  openListModal: (filter: ListModalFilter) => void;
  closeListModal: () => void;

  setCalendarMonth: (month: string) => void;
  selectCalendarDate: (date: string | null) => void;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tag: string | null) => void;
  setDateFilter: (filter: 'all' | 'today') => void;
  toggleOverdue: () => void;
  toggleShowCompletedPlans: () => void;
  
  toastMessage: string | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
  currentView: 'timeline',
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  isModalOpen: false,
  isAuthModalOpen: false,
  isTagModalOpen: false,
  isNewTagModalOpen: false,
  isNewBoardModalOpen: false,
  boardProjectId: null,
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
  showCompletedPlans: true,
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
  openNewBoardModal: () => set({ isNewBoardModalOpen: true }),
  closeNewBoardModal: () => set({ isNewBoardModalOpen: false }),
  setBoardProject: (projectId) => set({ boardProjectId: projectId }),

  openListModal: (filter) => set({ listModalFilter: filter }),
  closeListModal: () => set({ listModalFilter: null }),

  setCalendarMonth: (month) => set({ calendarCurrentMonth: month }),
  selectCalendarDate: (date) => set({ selectedCalendarDate: date }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTagFilter: (tag) => set({ tagFilter: tag }),
  setDateFilter: (filter) => set({ dateFilter: filter }),
  toggleOverdue: () => set((state) => ({ collapsedOverdue: !state.collapsedOverdue })),
  toggleShowCompletedPlans: () => set((state) => ({ showCompletedPlans: !state.showCompletedPlans })),
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },
  hideToast: () => set({ toastMessage: null }),
    }),
    {
      name: 'zhouzhou-ui-storage',
      // 只记住这个开关，弹窗/当前视图这些临时状态不该跨刷新保留
      partialize: (state) => ({ showCompletedPlans: state.showCompletedPlans }),
    }
  )
);
