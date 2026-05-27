import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Tag, X, Flag, LayoutGrid, AlignLeft, Trash2, ChevronRight } from 'lucide-react';
import { getTagColor } from '../../utils/colorUtils';
import { clsx } from 'clsx';
import type { Priority, TodoStatus, Quadrant, CreateTodoInput } from '../../types';
import { QUADRANT_LABELS, TAG_TONES } from '../../types';
import { useTodoStore } from '../../store/todoStore';
import { useUIStore } from '../../store/uiStore';
import { usePlanStore } from '../../store/planStore';
import { getNextSortOrder } from '../../utils/todoUtils';
import { TODAY } from '../../utils/dateUtils';

const QUADRANTS: Quadrant[] = [
  'important_urgent', 'important_not_urgent',
  'not_important_urgent', 'not_important_not_urgent',
];

interface TodoFormProps {
  onClose: () => void;
}

export function TodoForm({ onClose }: TodoFormProps) {
  const { todos, addTodo, updateTodo } = useTodoStore();
  const { editingTodoId, defaultDueDate, defaultStatus, defaultQuadrant, defaultTitle, defaultPlanId, defaultTags } = useUIStore();
  const { updatePlan, tags: planTags } = usePlanStore();

  const isEditing = !!editingTodoId;
  const editingTodo = isEditing ? todos.find(t => t.id === editingTodoId) : null;

  // Use the default tags provided by uiStore, or parse from searchQuery if it was passed that way
  const initialTags = useMemo(() => {
    if (editingTodo?.tags) return editingTodo.tags;
    if (defaultTags && defaultTags.length > 0) return defaultTags;
    return [];
  }, [editingTodo?.tags, defaultTags]);

  const [title, setTitle] = useState(editingTodo?.title ?? defaultTitle ?? '');
  const [note, setNote] = useState(editingTodo?.note ?? '');
  const [dueDate, setDueDate] = useState(editingTodo?.dueDate ?? defaultDueDate ?? '');
  const [priority, setPriority] = useState<Priority>(editingTodo?.priority ?? 'none');
  const [status, setStatus] = useState<TodoStatus>(editingTodo?.status ?? defaultStatus ?? 'todo');
  const [quadrant, setQuadrant] = useState<Quadrant>(editingTodo?.quadrant ?? defaultQuadrant ?? 'not_important_not_urgent');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const toggleProject = (projectId: string) => {
    const newSet = new Set(expandedProjects);
    if (newSet.has(projectId)) {
      newSet.delete(projectId);
    } else {
      newSet.add(projectId);
    }
    setExpandedProjects(newSet);
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!title.trim() || !dueDate) return;

    const finalTags = tags;

    // Auto-save any new tags to global (legacy logic, keep to avoid breaking todoStore if used elsewhere)
    finalTags.forEach(t => useTodoStore.getState().addGlobalTag(t));

    if (isEditing && editingTodo) {
      updateTodo(editingTodo.id, {
        title: title.trim(),
        note: note || undefined,
        dueDate: dueDate || undefined,
        priority, status, quadrant, tags: finalTags,
      });
    } else {
      const input: CreateTodoInput = {
        title: title.trim(),
        note: note || undefined,
        dueDate: dueDate || undefined,
        priority, status, quadrant, tags: finalTags,
        sortOrder: getNextSortOrder(todos),
        planId: defaultPlanId,
      };
      const newTodoId = addTodo(input);
      if (defaultPlanId) {
        updatePlan(defaultPlanId, { todoId: newTodoId });
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && editingTodo) {
      useTodoStore.getState().deleteTodo(editingTodo.id);
      onClose();
    }
  };

  const QUADRANT_CONFIG_FORM: Record<Quadrant, { activeCls: string; emoji: string }> = {
    important_urgent: { activeCls: 'opt-danger', emoji: '🔥' },
    important_not_urgent: { activeCls: 'opt-brand', emoji: '📌' },
    not_important_urgent: { activeCls: 'opt-warn', emoji: '⚡' },
    not_important_not_urgent: { activeCls: '', emoji: '🗂️' },
  };

  const STATUS_CONFIG_FORM: Record<TodoStatus, { activeCls: string; label: string }> = {
    todo: { activeCls: '', label: '未开始' },
    in_progress: { activeCls: 'opt-warn', label: '进行中' },
    done: { activeCls: 'opt-brand', label: '已完成' },
    cancelled: { activeCls: '', label: '已取消' },
  };

  const PRIORITY_CONFIG_FORM: Record<Priority, { activeCls: string; label: string; dot: string }> = {
    high: { activeCls: 'opt-danger', label: '高', dot: 'danger' },
    medium: { activeCls: 'opt-warn', label: '中', dot: 'warn' },
    low: { activeCls: 'opt-info', label: '低', dot: 'info' },
    none: { activeCls: '', label: '无', dot: '' },
  };

  return (
    <div className="flex flex-col">
      {/* Title area */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <input
          ref={titleRef}
          type="text"
          placeholder="待办事项标题…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
          className="w-full text-base font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
        {/* Note */}
        <div className="flex gap-2 items-start mt-3">
          <AlignLeft size={14} className="text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" />
          <textarea
            placeholder="添加备注…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="w-full text-sm bg-transparent border-none outline-none text-gray-500 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"
          />
        </div>
      </div>

      {/* Properties */}
      <div className="px-6 py-4 space-y-4">

        {/* Row: Due date */}
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-400 w-12 flex-shrink-0">到期日<span className="text-red-400 ml-0.5">*</span></span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dueDate}
              min={TODAY()}
              onChange={e => setDueDate(e.target.value)}
              className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              required
            />
            {dueDate && (
              <button onClick={() => setDueDate('')} className="text-gray-400 hover:text-red-400 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Row: Priority */}
        <div className="flex items-center gap-3">
          <Flag size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-400 w-12 flex-shrink-0">优先级</span>
          <div className="flex gap-1.5">
            {(Object.keys(PRIORITY_CONFIG_FORM) as Priority[]).map(p => {
              const cfg = PRIORITY_CONFIG_FORM[p];
              const isActive = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={clsx('opt-btn', isActive && ['active', cfg.activeCls])}
                >
                  {cfg.dot && <span className={clsx('dot', cfg.dot)} />}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row: Status */}
        <div className="flex items-center gap-3">
          <div className="w-[14px] flex-shrink-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600" />
          </div>
          <span className="text-xs text-gray-400 w-12 flex-shrink-0">状态</span>
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(STATUS_CONFIG_FORM) as TodoStatus[]).map(s => {
              const cfg = STATUS_CONFIG_FORM[s];
              const isActive = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={clsx('opt-btn', isActive && ['active', cfg.activeCls])}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row: Quadrant */}
        <div className="flex items-start gap-3">
          <LayoutGrid size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-gray-400 w-12 flex-shrink-0 mt-0.5">象限</span>
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            {QUADRANTS.map(q => {
              const cfg = QUADRANT_CONFIG_FORM[q];
              const isActive = quadrant === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuadrant(q)}
                  className={clsx('opt-btn', isActive && ['active', cfg.activeCls])}
                >
                  <span className="text-[13px]">{cfg.emoji}</span>
                  {QUADRANT_LABELS[q].short}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row: Tags */}
        <div className="flex items-start gap-3">
          <Tag size={14} className="text-gray-400 flex-shrink-0 mt-2" />
          <span className="text-xs text-gray-400 w-12 flex-shrink-0 mt-2">标签</span>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-[var(--bg)] font-medium shadow-sm transition-transform hover:scale-105" style={{ background: getTagColor(tag) }}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:bg-black/20 rounded-full p-0.5 transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
              
              <button
                type="button"
                onClick={() => setShowTagMenu(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] bg-[var(--surface-2)] border border-[var(--line-soft)] rounded-lg hover:bg-[var(--hover)] hover:text-[var(--ink-1)] transition-colors"
              >
                选择标签
              </button>
              
              <button
                type="button"
                onClick={() => useUIStore.getState().openNewTagModal()}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] bg-[var(--surface-2)] border border-[var(--line-soft)] rounded-lg hover:bg-[var(--hover)] hover:text-[var(--ink-1)] transition-colors"
              >
                + 新建标签
              </button>
            </div>

            {/* Tag Selection Modal */}
            {showTagMenu && (
              <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]" onClick={() => setShowTagMenu(false)}>
                <div className="bg-[var(--bg)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="px-5 py-4 border-b border-[var(--line-soft)] flex justify-between items-center bg-[var(--surface)]">
                    <h3 className="font-semibold text-[var(--ink-1)]">选择标签</h3>
                    <button onClick={() => setShowTagMenu(false)} className="p-1 hover:bg-[var(--hover)] rounded-md transition-colors text-[var(--ink-3)] hover:text-[var(--ink-1)]">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    {planTags.filter(t => t.level === 'L1').map(pTag => {
                      const isExpanded = expandedProjects.has(pTag.id);
                      const pCats = planTags.filter(cTag => cTag.level === 'L2' && cTag.parentId === pTag.id);
                      
                      return (
                        <div key={pTag.id} className="tag-group">
                          <div 
                            className="flex items-center p-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface)] hover:bg-[var(--hover)] transition-colors cursor-pointer group"
                            onClick={() => {
                              if (!tags.includes(pTag.name)) setTags([...tags, pTag.name]);
                              setShowTagMenu(false);
                            }}
                          >
                            <button
                              className="p-1.5 text-[var(--ink-4)] hover:text-[var(--ink-2)] transition-colors flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProject(pTag.id);
                              }}
                            >
                              <ChevronRight size={14} className={clsx("transition-transform", isExpanded && "rotate-90")} />
                            </button>
                            <span 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mx-2" 
                              style={{ background: TAG_TONES[pTag.tone] }}
                            />
                            <span className="font-medium text-[var(--ink-1)] flex-1">
                              {pTag.name}
                            </span>
                          </div>

                          {isExpanded && pCats.length > 0 && (
                            <div className="pl-6 mt-1 space-y-1 border-l border-[var(--line-soft)] ml-4">
                              {pCats.map(cTag => {
                                return (
                                  <div 
                                    key={cTag.id}
                                    className="flex items-center p-2 pl-3 rounded-md hover:bg-[var(--hover)] transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (!tags.includes(cTag.name)) setTags([...tags, cTag.name]);
                                      setShowTagMenu(false);
                                    }}
                                  >
                                    <span 
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mr-2" 
                                      style={{ background: TAG_TONES[cTag.tone] }}
                                    />
                                    <span className="text-sm text-[var(--ink-2)]">
                                      {cTag.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {planTags.filter(t => t.level === 'L1').length === 0 && (
                      <div className="text-center py-8 text-sm text-[var(--ink-4)]">
                        暂无标签，请先新建标签
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-slate-900/60">
        <div>
          {isEditing && (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="删除待办"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !dueDate}
            className="primary-btn !px-6 !py-2.5 !h-auto !w-auto text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{isEditing ? '保存更改' : '创建待办'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
