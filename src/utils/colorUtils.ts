import type { Priority, TodoStatus, Quadrant } from '../types';

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string; dot: string }> = {
  high:   { bg: 'bg-red-50 dark:bg-red-950/30',    text: 'text-red-600 dark:text-red-400',    border: 'border-red-200 dark:border-red-800',    dot: 'bg-red-500' },
  medium: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  low:    { bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-200 dark:border-blue-800',   dot: 'bg-blue-500' },
  none:   { bg: 'bg-gray-50 dark:bg-gray-900/30',   text: 'text-gray-500 dark:text-gray-400',   border: 'border-gray-200 dark:border-gray-700',   dot: 'bg-gray-400' },
};

export const STATUS_COLORS: Record<TodoStatus, { bg: string; text: string; badge: string }> = {
  todo:        { bg: 'bg-slate-50 dark:bg-slate-900',  text: 'text-slate-700 dark:text-slate-300',  badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  in_progress: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  done:        { bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  cancelled:   { bg: 'bg-gray-50 dark:bg-gray-900/40', text: 'text-gray-500 dark:text-gray-400',   badge: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

export const QUADRANT_COLORS: Record<Quadrant, {
  bg: string; headerBg: string; border: string; text: string; accent: string; lightBg: string;
}> = {
  important_urgent: {
    bg: 'bg-red-50/60 dark:bg-red-950/20',
    headerBg: 'bg-red-500',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    accent: 'text-red-500',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
  },
  important_not_urgent: {
    bg: 'bg-blue-50/60 dark:bg-blue-950/20',
    headerBg: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    accent: 'text-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  not_important_urgent: {
    bg: 'bg-orange-50/60 dark:bg-orange-950/20',
    headerBg: 'bg-orange-500',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    accent: 'text-orange-500',
    lightBg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  not_important_not_urgent: {
    bg: 'bg-gray-50/60 dark:bg-gray-900/30',
    headerBg: 'bg-gray-400 dark:bg-gray-600',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    accent: 'text-gray-500',
    lightBg: 'bg-gray-50 dark:bg-gray-800/40',
  },
};

export const PRIORITY_HEX: Record<Priority, string> = {
  high: '#EF4444',
  medium: '#F97316',
  low: '#3B82F6',
  none: '#9CA3AF',
};
