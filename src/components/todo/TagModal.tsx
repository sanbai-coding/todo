import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../store/uiStore';
import { usePlanStore } from '../../store/planStore';
import { Trash2, ChevronRight, Plus } from 'lucide-react';
import { TAG_TONES } from '../../types/plan';

export function TagModal() {
  const { isTagModalOpen, closeTagModal, openNewTagModal } = useUIStore();
  const { tags, projects, categories, plans, deleteTag, deleteProject } = usePlanStore();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  if (!isTagModalOpen) return null;

  const projectTags = tags.filter(t => t.level === 'L1');
  const categoryTags = tags.filter(t => t.level === 'L2');

  const getProjectCategories = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    return project.categoryIds.map(catId => {
      const cat = categories.find(c => c.id === catId);
      const tag = categoryTags.find(t => t.id === catId);
      return { category: cat, tag };
    }).filter(item => item.category && item.tag);
  };

  const getProjectTodoCount = (projectId: string) => {
    const projectCategories = getProjectCategories(projectId);
    let count = 0;
    projectCategories.forEach(({ category }) => {
      if (category) {
        category.planIds.forEach(planId => {
          const plan = plans.find(p => p.id === planId);
          if (plan?.todoId) {
            count++;
          }
        });
      }
    });
    return count;
  };

  const getCategoryTodoCount = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    let count = 0;
    category.planIds.forEach(planId => {
      const plan = plans.find(p => p.id === planId);
      if (plan?.todoId) {
        count++;
      }
    });
    return count;
  };

  const toggleProject = (projectId: string) => {
    const newSet = new Set(expandedProjects);
    if (newSet.has(projectId)) {
      newSet.delete(projectId);
    } else {
      newSet.add(projectId);
    }
    setExpandedProjects(newSet);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('删除项目会同时删除该项目的所有分类和计划，确定要删除吗？')) {
      deleteProject(projectId);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('确定要删除该分类吗？')) {
      deleteTag(categoryId);
    }
  };

  return (
    <Modal isOpen={isTagModalOpen} onClose={closeTagModal} title="标签管理">
      <div className="p-5">
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {projectTags.length === 0 ? (
            <div className="text-center text-sm text-[var(--ink-4)] py-8">
              暂无标签，请点击下方新建
            </div>
          ) : (
            projectTags.map(projectTag => {
              const isExpanded = expandedProjects.has(projectTag.id);
              const projectCategories = getProjectCategories(projectTag.id);
              const projectColor = TAG_TONES[projectTag.tone];
              const categoryCount = projectCategories.length;
              const todoCount = getProjectTodoCount(projectTag.id);
              
              return (
                <div key={projectTag.id} className="tag-group">
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface)] hover:bg-[var(--hover)] transition-colors cursor-pointer"
                    onClick={() => toggleProject(projectTag.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ background: projectColor }}
                      />
                      <span className="font-medium text-[var(--ink-1)]">
                        {projectTag.name}
                      </span>
                      <span className="text-xs text-[var(--ink-3)]">
                        {categoryCount > 0 && `${categoryCount}分类`}
                        {categoryCount > 0 && todoCount > 0 && ' · '}
                        {todoCount > 0 && `${todoCount}待办`}
                        {categoryCount === 0 && todoCount === 0 && '空项目'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(projectTag.id);
                        }}
                        className="p-1.5 text-[var(--ink-4)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-md transition-colors"
                        title="删除项目"
                      >
                        <Trash2 size={14} />
                      </button>
                      <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={16} className="text-[var(--ink-3)]" />
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {projectCategories.length === 0 ? (
                        <div className="text-xs text-[var(--ink-4)] py-2 pl-3">
                          暂无分类
                        </div>
                      ) : (
                        projectCategories.map(({ category, tag }) => {
                          if (!category || !tag) return null;
                          const catColor = TAG_TONES[tag.tone];
                          const catTodoCount = getCategoryTodoCount(category.id);
                          
                          return (
                            <div key={category.id} className="group">
                              <div 
                                className="flex items-center justify-between p-2 pl-3 rounded-md hover:bg-[var(--hover)] transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                                    style={{ background: catColor }}
                                  />
                                  <span className="text-sm text-[var(--ink-2)]">
                                    {tag.name}
                                  </span>
                                  <span className="text-xs text-[var(--ink-3)]">
                                    {catTodoCount > 0 ? `${catTodoCount}待办` : '无待办'}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(category.id);
                                  }}
                                  className="p-1 text-[var(--ink-4)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded transition-colors opacity-0 group-hover:opacity-100"
                                  title="删除分类"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--line-soft)]">
          <button
            onClick={() => openNewTagModal()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--brand)] hover:opacity-90 text-[var(--brand-ink)] rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            新建标签
          </button>
        </div>
      </div>
    </Modal>
  );
}
