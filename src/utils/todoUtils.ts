import type { Todo, TodoStatus, Quadrant, Priority } from '../types';
import { isOverdue, isTodayStr, TODAY } from './dateUtils';

export function groupByStatus(todos: Todo[]): Record<TodoStatus, Todo[]> {
  const groups: Record<TodoStatus, Todo[]> = {
    todo: [], in_progress: [], done: [], cancelled: [],
  };
  for (const todo of todos) {
    groups[todo.status].push(todo);
  }
  Object.values(groups).forEach(arr => arr.sort((a, b) => a.sortOrder - b.sortOrder));
  return groups;
}

export function groupByQuadrant(todos: Todo[]): Record<Quadrant, Todo[]> {
  const groups: Record<Quadrant, Todo[]> = {
    important_urgent: [],
    important_not_urgent: [],
    not_important_urgent: [],
    not_important_not_urgent: [],
  };
  for (const todo of todos) {
    groups[todo.quadrant].push(todo);
  }
  Object.values(groups).forEach(arr => arr.sort((a, b) => a.sortOrder - b.sortOrder));
  return groups;
}

export function groupByDate(todos: Todo[]): {
  overdue: Todo[];
  today: Todo[];
  byDate: Record<string, Todo[]>;
} {
  const overdue: Todo[] = [];
  const today: Todo[] = [];
  const byDate: Record<string, Todo[]> = {};

  const todayStr = TODAY();

  for (const todo of todos) {
    if (todo.status === 'done' || todo.status === 'cancelled') continue;
    if (!todo.dueDate) continue;

    if (isOverdue(todo.dueDate)) {
      overdue.push(todo);
    } else if (isTodayStr(todo.dueDate)) {
      today.push(todo);
    } else {
      if (!byDate[todo.dueDate]) byDate[todo.dueDate] = [];
      byDate[todo.dueDate].push(todo);
    }
  }

  const noDueDate = todos.filter(t =>
    !t.dueDate && t.status !== 'done' && t.status !== 'cancelled'
  );
  if (noDueDate.length > 0) {
    if (!byDate[todayStr]) byDate[todayStr] = [];
    today.push(...noDueDate);
  }

  overdue.sort((a, b) => a.sortOrder - b.sortOrder);
  today.sort((a, b) => a.sortOrder - b.sortOrder);
  Object.values(byDate).forEach(arr => arr.sort((a, b) => a.sortOrder - b.sortOrder));

  return { overdue, today, byDate };
}

export function groupByDateForCalendar(todos: Todo[]): Record<string, Todo[]> {
  const byDate: Record<string, Todo[]> = {};
  for (const todo of todos) {
    if (!todo.dueDate) continue;
    if (!byDate[todo.dueDate]) byDate[todo.dueDate] = [];
    byDate[todo.dueDate].push(todo);
  }
  return byDate;
}

export function filterTodos(todos: Todo[], searchText: string): Todo[] {
  if (!searchText.trim()) return todos;
  const q = searchText.toLowerCase();
  return todos.filter(t =>
    t.title.toLowerCase().includes(q) ||
    (t.note?.toLowerCase().includes(q)) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

export function getNextSortOrder(todos: Todo[]): number {
  if (todos.length === 0) return 1000;
  return Math.max(...todos.map(t => t.sortOrder)) + 1000;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };

export function sortTodos(todos: Todo[], field: 'sortOrder' | 'priority' | 'dueDate'): Todo[] {
  return [...todos].sort((a, b) => {
    if (field === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (field === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.sortOrder - b.sortOrder;
  });
}
