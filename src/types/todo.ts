export type Priority = 'high' | 'medium' | 'low' | 'none';
export type TodoStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type Quadrant =
  | 'important_urgent'
  | 'important_not_urgent'
  | 'not_important_urgent'
  | 'not_important_not_urgent';

export interface Todo {
  id: string;
  title: string;
  note?: string;
  dueDate?: string; // "YYYY-MM-DD"
  priority: Priority;
  status: TodoStatus;
  quadrant: Quadrant;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  sortOrder: number;
}

export type CreateTodoInput = Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>;
export type UpdateTodoInput = Partial<Omit<Todo, 'id' | 'createdAt'>>;

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
  none: '无优先级',
};

export const STATUS_LABELS: Record<TodoStatus, string> = {
  todo: '未开始',
  in_progress: '进行中',
  done: '已完成',
  cancelled: '已取消',
};

export const QUADRANT_LABELS: Record<Quadrant, { short: string; desc: string }> = {
  important_urgent: { short: '重要紧急', desc: '立即处理' },
  important_not_urgent: { short: '重要不紧急', desc: '计划安排' },
  not_important_urgent: { short: '不重要紧急', desc: '委托他人' },
  not_important_not_urgent: { short: '不重要不紧急', desc: '考虑删除' },
};
