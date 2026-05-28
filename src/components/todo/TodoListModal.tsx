import { Modal } from '../common/Modal';
import { useUIStore } from '../../store/uiStore';
import { useTodoStore } from '../../store/todoStore';
import { TodoItem } from './TodoItem';
import { isOverdue } from '../../utils/dateUtils';

export function TodoListModal() {
  const { listModalFilter, closeListModal } = useUIStore();
  const { todos } = useTodoStore();

  if (!listModalFilter) return null;

  let filteredTodos = todos;
  let title = '';

  switch (listModalFilter) {
    case 'pending':
      filteredTodos = todos.filter(t => t.status === 'todo' || t.status === 'in_progress');
      title = '待完成事项';
      break;
    case 'done':
      filteredTodos = todos.filter(t => t.status === 'done');
      title = '已完成事项';
      break;
    case 'in_progress':
      filteredTodos = todos.filter(t => t.status === 'in_progress');
      title = '进行中事项';
      break;
    case 'high_priority':
      filteredTodos = todos.filter(t => t.priority === 'high');
      title = '高优先级事项';
      break;
    case 'overdue':
      filteredTodos = todos.filter(t => t.status !== 'done' && t.status !== 'cancelled' && t.dueDate && isOverdue(t.dueDate));
      title = '已逾期事项';
      break;
  }

  return (
    <Modal
      isOpen={!!listModalFilter}
      onClose={closeListModal}
      title={`${title} (${filteredTodos.length})`}
    >
      <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50">
        {filteredTodos.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {filteredTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} variant="row" />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">
            暂无{title}
          </div>
        )}
      </div>
    </Modal>
  );
}
