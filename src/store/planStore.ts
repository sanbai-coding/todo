import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Project, Category, Plan, Tag, TagTone, TagLevel } from '../types';
import { useAuthStore } from './authStore';

interface PlanState {
  projects: Project[];
  categories: Category[];
  plans: Plan[];
  tags: Tag[];
  fetchFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  
  addProject: (name: string, tone: TagTone) => void;
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
  toggleProjectOpen: (id: string) => void;

  copyProject: (id: string) => void;
  addCategory: (projectId: string, name: string) => void;
  updateCategory: (id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>) => void;
  deleteCategory: (id: string) => void;
  toggleCategoryOpen: (id: string) => void;

  addPlan: (projectId: string, categoryId: string, title: string) => void;
  copyPlan: (planId: string) => void;
  updatePlan: (id: string, data: Partial<Omit<Plan, 'id' | 'createdAt'>>) => void;
  deletePlan: (id: string) => void;
  linkTodoToPlan: (planId: string, todoId: string) => void;
  unlinkTodoFromPlan: (planId: string) => void;

  addTag: (name: string, level: TagLevel, tone: TagTone, parentId?: string) => void;
  updateTag: (id: string, data: Partial<Omit<Tag, 'id' | 'createdAt'>>) => void;
  deleteTag: (id: string) => void;

  getProjectTags: () => Tag[];
  getCategoryTags: (projectId?: string) => Tag[];
  getPlansByProject: (projectId: string) => Plan[];
  getPlansByCategory: (categoryId: string) => Plan[];
}

const triggerSync = () => {
  const user = useAuthStore.getState().user;
  if (user) {
    usePlanStore.getState().syncToCloud();
  }
};

export const usePlanStore = create<PlanState>()(
  persist(
    immer((set, get) => ({
      projects: [],
      categories: [],
      plans: [],
      tags: [],

      fetchFromCloud: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
      },

      syncToCloud: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
      },

      addProject: (name, tone) => {
        set((state) => {
          const now = new Date().toISOString();
          const project: Project = {
            id: nanoid(),
            name,
            tone,
            categoryIds: [],
            isOpen: true,
            sortOrder: state.projects.length * 1000,
            createdAt: now,
          };
          state.projects.push(project);
          
          const tag: Tag = {
            id: project.id,
            name,
            level: 'L1',
            tone,
            createdAt: now,
          };
          state.tags.push(tag);
        });
        triggerSync();
      },

      updateProject: (id, data) => {
        set((state) => {
          const project = state.projects.find(p => p.id === id);
          if (!project) return;
          Object.assign(project, data);
          
          const tag = state.tags.find(t => t.id === id);
          if (tag && data.name) {
            tag.name = data.name;
          }
          if (tag && data.tone) {
            tag.tone = data.tone;
          }
        });
        triggerSync();
      },

      deleteProject: (id) => {
        set((state) => {
          const project = state.projects.find(p => p.id === id);
          if (!project) return;
          
          project.categoryIds.forEach(catId => {
            const cat = state.categories.find(c => c.id === catId);
            if (cat) {
              cat.planIds.forEach(planId => {
                state.plans = state.plans.filter(p => p.id !== planId);
              });
              state.categories = state.categories.filter(c => c.id !== catId);
            }
          });
          
          state.projects = state.projects.filter(p => p.id !== id);
          state.tags = state.tags.filter(t => t.id !== id);
        });
        triggerSync();
      },

      toggleProjectOpen: (id) => {
        set((state) => {
          const project = state.projects.find(p => p.id === id);
          if (project) {
            project.isOpen = !project.isOpen;
          }
        });
        triggerSync();
      },

      copyProject: (id) => {
        set((state) => {
          const project = state.projects.find(p => p.id === id);
          if (!project) return;
          const now = new Date().toISOString();
          const newProjId = nanoid();
          
          const newProject: Project = {
            ...project,
            id: newProjId,
            name: `${project.name} (副本)`,
            categoryIds: [],
            createdAt: now,
          };
          
          const newTag: Tag = {
            id: newProjId,
            name: newProject.name,
            level: 'L1',
            tone: project.tone,
            createdAt: now,
          };
          
          state.projects.push(newProject);
          state.tags.push(newTag);

          // Deep copy categories and plans
          project.categoryIds.forEach(catId => {
            const cat = state.categories.find(c => c.id === catId);
            if (cat) {
              const newCatId = nanoid();
              const newCat: Category = {
                ...cat,
                id: newCatId,
                projectId: newProjId,
                planIds: [],
                createdAt: now,
              };
              
              const newCatTag: Tag = {
                id: newCatId,
                name: cat.name,
                level: 'L2',
                tone: project.tone,
                parentId: newProjId,
                createdAt: now,
              };
              
              state.categories.push(newCat);
              state.tags.push(newCatTag);
              newProject.categoryIds.push(newCatId);

              // Copy plans
              cat.planIds.forEach(planId => {
                const plan = state.plans.find(p => p.id === planId);
                if (plan) {
                  const newPlanId = nanoid();
                  const newPlan: Plan = {
                    ...plan,
                    id: newPlanId,
                    projectId: newProjId,
                    categoryId: newCatId,
                    todoId: undefined, // Don't copy todo linkage
                    createdAt: now,
                  };
                  state.plans.push(newPlan);
                  newCat.planIds.push(newPlanId);
                }
              });
            }
          });
        });
        triggerSync();
      },

      addCategory: (projectId, name) => {
        set((state) => {
          const now = new Date().toISOString();
          const project = state.projects.find(p => p.id === projectId);
          if (!project) return;
          
          const category: Category = {
            id: nanoid(),
            name,
            projectId,
            planIds: [],
            isOpen: true,
            sortOrder: project.categoryIds.length * 1000,
            createdAt: now,
          };
          state.categories.push(category);
          project.categoryIds.push(category.id);
          
          const parentTag = state.tags.find(t => t.id === projectId);
          const tag: Tag = {
            id: category.id,
            name,
            level: 'L2',
            tone: parentTag?.tone || 'teal',
            parentId: projectId,
            createdAt: now,
          };
          state.tags.push(tag);
        });
        triggerSync();
      },

      updateCategory: (id, data) => {
        set((state) => {
          const category = state.categories.find(c => c.id === id);
          if (!category) return;
          Object.assign(category, data);
          
          const tag = state.tags.find(t => t.id === id);
          if (tag && data.name) {
            tag.name = data.name;
          }
        });
        triggerSync();
      },

      deleteCategory: (id) => {
        set((state) => {
          const category = state.categories.find(c => c.id === id);
          if (!category) return;
          
          const project = state.projects.find(p => p.id === category.projectId);
          if (project) {
            project.categoryIds = project.categoryIds.filter(cId => cId !== id);
          }
          
          category.planIds.forEach(planId => {
            state.plans = state.plans.filter(p => p.id !== planId);
          });
          
          state.categories = state.categories.filter(c => c.id !== id);
          state.tags = state.tags.filter(t => t.id !== id);
        });
        triggerSync();
      },

      toggleCategoryOpen: (id) => {
        set((state) => {
          const category = state.categories.find(c => c.id === id);
          if (category) {
            category.isOpen = !category.isOpen;
          }
        });
      },

      addPlan: (projectId, categoryId, title) => {
        set((state) => {
          const now = new Date().toISOString();
          const category = state.categories.find(c => c.id === categoryId);
          if (!category) return;
          
          const plan: Plan = {
            id: nanoid(),
            title,
            projectId,
            categoryId,
            sortOrder: category.planIds.length * 1000,
            createdAt: now,
            updatedAt: now,
          };
          state.plans.push(plan);
          category.planIds.push(plan.id);
        });
        triggerSync();
      },

      copyPlan: (planId) => {
        set((state) => {
          const plan = state.plans.find(p => p.id === planId);
          if (!plan) return;
          
          const newPlanId = nanoid();
          const newPlan: Plan = {
            ...plan,
            id: newPlanId,
            title: `${plan.title} (副本)`,
            todoId: undefined, // 不要复制待办的关联
            createdAt: new Date().toISOString(),
          };
          
          state.plans.push(newPlan);
          
          const category = state.categories.find(c => c.id === plan.categoryId);
          if (category) {
            category.planIds.push(newPlanId);
          }
        });
        triggerSync();
      },

      updatePlan: (id, data) => {
        set((state) => {
          const plan = state.plans.find(p => p.id === id);
          if (!plan) return;
          Object.assign(plan, data);
          plan.updatedAt = new Date().toISOString();
        });
        triggerSync();
      },

      deletePlan: (id) => {
        set((state) => {
          const plan = state.plans.find(p => p.id === id);
          if (!plan) return;
          
          const category = state.categories.find(c => c.id === plan.categoryId);
          if (category) {
            category.planIds = category.planIds.filter(pId => pId !== id);
          }
          
          state.plans = state.plans.filter(p => p.id !== id);
        });
        triggerSync();
      },

      linkTodoToPlan: (planId, todoId) => {
        set((state) => {
          const plan = state.plans.find(p => p.id === planId);
          if (plan) {
            plan.todoId = todoId;
            plan.updatedAt = new Date().toISOString();
          }
        });
        triggerSync();
      },

      unlinkTodoFromPlan: (planId) => {
        set((state) => {
          const plan = state.plans.find(p => p.id === planId);
          if (plan) {
            plan.todoId = undefined;
            plan.updatedAt = new Date().toISOString();
          }
        });
        triggerSync();
      },

      addTag: (name, level, tone, parentId) => {
        set((state) => {
          const now = new Date().toISOString();
          const tag: Tag = {
            id: nanoid(),
            name,
            level,
            tone,
            parentId,
            createdAt: now,
          };
          state.tags.push(tag);
          
          if (level === 'L1') {
            const project: Project = {
              id: tag.id,
              name,
              tone,
              categoryIds: [],
              isOpen: true,
              sortOrder: state.projects.length * 1000,
              createdAt: now,
            };
            state.projects.push(project);
          } else if (level === 'L2' && parentId) {
            const category: Category = {
              id: tag.id,
              name,
              projectId: parentId,
              planIds: [],
              isOpen: true,
              sortOrder: 0,
              createdAt: now,
            };
            state.categories.push(category);
            const parent = state.projects.find(p => p.id === parentId);
            if (parent) {
              parent.categoryIds.push(category.id);
            }
          }
        });
        triggerSync();
      },

      updateTag: (id, data) => {
        set((state) => {
          const tag = state.tags.find(t => t.id === id);
          if (!tag) return;
          Object.assign(tag, data);
          
          if (tag.level === 'L1') {
            const project = state.projects.find(p => p.id === id);
            if (project) {
              if (data.name) project.name = data.name;
              if (data.tone) project.tone = data.tone;
            }
          } else {
            const category = state.categories.find(c => c.id === id);
            if (category && data.name) {
              category.name = data.name;
            }
          }
        });
        triggerSync();
      },

      deleteTag: (id) => {
        set((state) => {
          const tag = state.tags.find(t => t.id === id);
          if (!tag) return;
          
          if (tag.level === 'L1') {
            const project = state.projects.find(p => p.id === id);
            if (project) {
              project.categoryIds.forEach(catId => {
                const cat = state.categories.find(c => c.id === catId);
                if (cat) {
                  cat.planIds.forEach(planId => {
                    state.plans = state.plans.filter(p => p.id !== planId);
                  });
                  state.categories = state.categories.filter(c => c.id !== catId);
                  state.tags = state.tags.filter(t => t.id !== catId);
                }
              });
              state.projects = state.projects.filter(p => p.id !== id);
            }
          } else {
            const category = state.categories.find(c => c.id === id);
            if (category) {
              const parent = state.projects.find(p => p.id === category.projectId);
              if (parent) {
                parent.categoryIds = parent.categoryIds.filter(cId => cId !== id);
              }
              category.planIds.forEach(planId => {
                state.plans = state.plans.filter(p => p.id !== planId);
              });
              state.categories = state.categories.filter(c => c.id !== id);
            }
          }
          state.tags = state.tags.filter(t => t.id !== id);
        });
        triggerSync();
      },

      getProjectTags: () => {
        return get().tags.filter(t => t.level === 'L1');
      },

      getCategoryTags: (projectId) => {
        const tags = get().tags.filter(t => t.level === 'L2');
        if (projectId) {
          return tags.filter(t => t.parentId === projectId);
        }
        return tags;
      },

      getPlansByProject: (projectId) => {
        return get().plans.filter(p => p.projectId === projectId);
      },

      getPlansByCategory: (categoryId) => {
        return get().plans.filter(p => p.categoryId === categoryId);
      },
    })),
    {
      name: 'zhouzhou-plan-storage',
      partialize: (state) => ({
        projects: state.projects,
        categories: state.categories,
        plans: state.plans,
        tags: state.tags,
      }),
    }
  )
);
