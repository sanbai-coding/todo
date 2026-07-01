import type { Todo, Project, Category, Plan, Tag } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CloudPlanData {
  projects: Project[];
  categories: Category[];
  plans: Plan[];
  tags: Tag[];
}

export const cloudApi = {
  async fetchTodos(userId: string): Promise<{ todos: Todo[], tags: string[] }> {
    try {
      const res = await fetch(`${API_BASE}/api/todos/${userId}`);
      const json = await res.json();
      if (json.success && json.data) {
        // Handle migration: if data is an array (old format), return it as todos
        if (Array.isArray(json.data)) {
          return { todos: json.data, tags: [] };
        }
        // New format: { items, tags }
        return { 
          todos: json.data.items || [], 
          tags: json.data.tags || [] 
        };
      }
      return { todos: [], tags: [] };
    } catch (error) {
      console.error('Failed to fetch data from cloud', error);
      return { todos: [], tags: [] };
    }
  },

  async syncTodos(userId: string, todos: Todo[], tags: string[]): Promise<boolean> {
    try {
      // We wrap it in a custom object but send it under the "todos" field 
      // so the backend doesn't need to be updated and redeployed.
      const payload = {
        todos: {
          items: todos,
          tags: tags
        }
      };
      const res = await fetch(`${API_BASE}/api/todos/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return json.success;
    } catch (error) {
      console.error('Failed to sync data to cloud', error);
      return false;
    }
  },

  async fetchPlans(userId: string): Promise<CloudPlanData | null> {
    try {
      const res = await fetch(`${API_BASE}/api/plans/${userId}`);
      const json = await res.json();
      if (json.success && json.data) {
        return {
          projects: json.data.projects || [],
          categories: json.data.categories || [],
          plans: json.data.plans || [],
          tags: json.data.tags || [],
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch plans from cloud', error);
      return null;
    }
  },

  async syncPlans(userId: string, data: CloudPlanData): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/plans/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      return json.success;
    } catch (error) {
      console.error('Failed to sync plans to cloud', error);
      return false;
    }
  },

  async trackEvent(userId: string, event: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, event })
      });
    } catch (error) {
      console.error('Failed to track event', error);
    }
  },

  async getStats(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      const json = await res.json();
      if (json.success) return json.data;
      return null;
    } catch (error) {
      console.error('Failed to get stats', error);
      return null;
    }
  }
};
