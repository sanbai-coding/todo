import { useState, useRef, useEffect } from 'react';
import { Calendar, Tag, X, Flag, LayoutGrid, AlignLeft } from 'lucide-react';
import { clsx } from 'clsx';
import type { Priority, TodoStatus, Quadrant, CreateTodoInput } from '../../types';
import { QUADRANT_LABELS } from '../../types';
import { useTodoStore } from '../../store/todoStore';
import { useUIStore } from '../../store/uiStore';
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
  const { editingTodoId, defaultDueDate, defaultStatus, defaultQuadrant } = useUIStore();

  const isEditing = !!editingTodoId;
  const editingTodo = isEditing ? todos.find(t => t.id === editingTodoId) : null;

  const [title, setTitle] = useState(editingTodo?.title ?? '');
  const [note, setNote] = useState(editingTodo?.note ?? '');
  const [dueDate, setDueDate] = useState(editingTodo?.dueDate ?? defaultDueDate ?? '');
  const [priority, setPriority] = useState<Priority>(editingTodo?.priority ?? 'none');
  const [status, setStatus] = useState<TodoStatus>(editingTodo?.status ?? defaultStatus ?? 'todo');
  const [quadrant, setQuadrant] = useState<Quadrant>(editingTodo?.quadrant ?? defaultQuadrant ?? 'not_important_not_urgent');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(editingTodo?.tags ?? []);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (isEditing && editingTodo) {
      updateTodo(editingTodo.id, {
        title: title.trim(),
        note: note || undefined,
        dueDate: dueDate || undefined,
        priority, status, quadrant, tags,
      });
    } else {
      const input: CreateTodoInput = {
        title: title.trim(),
        note: note || undefined,
        dueDate: dueDate || undefined,
        priority, status, quadrant, tags,
        sortOrder: getNextSortOrder(todos),
      };
      addTodo(input);
    }
    onClose();
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
          <span className="text-xs text-gray-400 w-12 flex-shrink-0">到期日</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dueDate}
              min={TODAY()}
              onChange={e => setDueDate(e.target.value)}
              className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
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
          <Tag size={14} className="text-gray-400 flex-shrink-0 mt-1" />
          <span className="text-xs text-gray-400 w-12 flex-shrink-0 mt-1">标签</span>
          <div className="flex-1 space-y-2">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-full text-xs">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-purple-800 dark:hover:text-purple-200 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="输入标签后按 Enter…"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-slate-900/60">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-5 py-2 text-sm rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors shadow-sm shadow-blue-500/30"
        >
          {isEditing ? '保存更改' : '创建待办'}
        </button>
      </div>
    </div>
  );
}
