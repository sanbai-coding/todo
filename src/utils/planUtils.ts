import type { Plan, Todo } from '../types';

/**
 * 规划事项关联的待办已完成或已取消时，卡片/条目是划线状态。
 * 「展示已完成」关掉时，这些划线事项要被隐藏。
 */
export function isPlanStruckThrough(plan: Plan, todos: Todo[]): boolean {
  if (!plan.todoId) return false;
  const todo = todos.find(t => t.id === plan.todoId);
  if (!todo) return false;
  return todo.status === 'done' || todo.status === 'cancelled';
}

export function filterVisiblePlans(plans: Plan[], todos: Todo[], showCompleted: boolean): Plan[] {
  if (showCompleted) return plans;
  return plans.filter(plan => !isPlanStruckThrough(plan, todos));
}
