import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { FolderKanban, Plus } from 'lucide-react';
import { usePlanStore } from '../../../store/planStore';
import { useUIStore } from '../../../store/uiStore';
import { TAG_TONES } from '../../../types';
import { useActiveBoardProject } from './useActiveBoardProject';

/** 顶栏的项目筛选器 —— 在项目规划视图里取代原本的标签筛选 */
export function ProjectFilter() {
  const { setBoardProject, openNewBoardModal } = useUIStore();
  const { categories, plans } = usePlanStore();
  const { projects, activeProject } = useActiveBoardProject();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const filtered = projects.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const planCount = (projectId: string) => plans.filter(p => p.projectId === projectId).length;
  const catCount = (projectId: string) => categories.filter(c => c.projectId === projectId).length;

  return (
    <div className="relative z-50 flex items-center" ref={menuRef}>
      <button
        className={clsx('tagfilter-trigger', showMenu && 'is-active')}
        onClick={() => setShowMenu(!showMenu)}
      >
        <span className="lead">
          <FolderKanban />
        </span>
        <span>{activeProject ? activeProject.name : '暂无项目'}</span>
        {activeProject && <span className="pill">{planCount(activeProject.id)}</span>}
        <span className="caret">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {showMenu && (
        <div className="tagfilter-panel" role="dialog" aria-label="切换项目">
          <div className="tfp-head">
            <span className="ttl">切换项目</span>
          </div>

          <div className="tfp-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              placeholder="搜索项目…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="tfp-list">
            {filtered.length > 0 ? (
              filtered.map(project => (
                <button
                  key={project.id}
                  className={clsx('tfp-row', activeProject?.id === project.id && 'on')}
                  onClick={() => { setBoardProject(project.id); setShowMenu(false); }}
                >
                  <span className="dot-tag" style={{ background: TAG_TONES[project.tone] }} />
                  <span className="name">{project.name}</span>
                  <span className="cnt">{catCount(project.id)} / {planCount(project.id)}</span>
                  <span className="tick">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-[12px] text-[var(--ink-4)] text-center">
                {projects.length === 0 ? '还没有项目' : '没有匹配的项目'}
              </div>
            )}
          </div>

          <div className="tfp-foot">
            <button
              className="manage"
              onClick={() => { setShowMenu(false); openNewBoardModal(); }}
            >
              <Plus />
              <span>新建项目</span>
            </button>
            <span className="right">共 {projects.length} 个项目</span>
          </div>
        </div>
      )}
    </div>
  );
}
