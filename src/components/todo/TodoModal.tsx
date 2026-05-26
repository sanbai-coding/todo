import { Modal } from '../common/Modal';
import { TodoForm } from './TodoForm';
import { useUIStore } from '../../store/uiStore';

export function TodoModal() {
  const { isModalOpen, editingTodoId, closeModal } = useUIStore();

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={editingTodoId ? '编辑待办' : '新建待办'}
    >
      <TodoForm onClose={closeModal} />
    </Modal>
  );
}
