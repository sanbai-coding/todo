import type { Todo, TodoStatus, Quadrant, Priority } from '../types';
import { isOverdue, isTodayStr, TODAY } from './dateUtils';
import { usePlanStore } from '../store/planStore';

/**
 * 标签筛选器给的是标签 id，而待办的 todo.tags 里存的是标签「名称」，
 * 直接拿 id 去 includes 永远匹配不到，筛选结果会全空。这里先把 id 换回名称。
 * 选中项目（L1）时，它下面所有分类（L2）的待办也算命中 —— 从月度规划/项目规划
 * 转过去的待办只带分类名，不带项目名。
 */
export function resolveTagFilterNames(tagFilter: string): string[] {
  const tags = usePlanStore.getState().tags;
  const target = tags.find(t => t.id === tagFilter);
  // 找不到就当它本来就是个名称（老数据里存的是名称）
  if (!target) return [tagFilter];
  if (target.level === 'L1') {
    const childNames = tags.filter(t => t.parentId === target.id).map(t => t.name);
    return [target.name, ...childNames];
  }
  return [target.name];
}

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
  const todayStr = TODAY();
  for (const todo of todos) {
    // Treat todos without a due date as "today" to sync with TimelineView
    const date = todo.dueDate || todayStr;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(todo);
  }
  return byDate;
}

export function filterTodos(
  todos: Todo[],
  searchText: string,
  tagFilter: string | null = null,
  dateFilter: 'all' | 'today' = 'all'
): Todo[] {
  let result = todos;
  if (dateFilter === 'today') {
    result = result.filter(t => !t.dueDate || isTodayStr(t.dueDate));
  }
  if (tagFilter) {
    const names = resolveTagFilterNames(tagFilter);
    result = result.filter(t => t.tags.some(tag => names.includes(tag)));
  }
  if (!searchText.trim()) return result;
  const q = searchText.toLowerCase();
  return result.filter(t =>
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
