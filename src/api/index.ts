import type { Todo } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const cloudApi = {
  async fetchTodos(userId: string): Promise<Todo[]> {
    try {
      const res = await fetch(`${API_BASE}/api/todos/${userId}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch todos from cloud', error);
      return [];
    }
  },

  async syncTodos(userId: string, todos: Todo[]): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/todos/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todos })
      });
      const json = await res.json();
      return json.success;
    } catch (error) {
      console.error('Failed to sync todos to cloud', error);
      return false;
    }
  }
};
