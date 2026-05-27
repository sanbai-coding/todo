import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { usePlanStore } from '../../store/planStore';
import { TAG_TONES } from '../../types';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';

export function TagFilter() {
  const { tagFilter, setTagFilter, openTagModal } = useUIStore();
  const { tags, projects, categories, plans } = usePlanStore();
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTagMenu(false);
      }
    };
    if (showTagMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagMenu]);

  const projectTags = tags.filter(t => t.level === 'L1');
  const categoryTags = tags.filter(t => t.level === 'L2');

  const filteredProjectTags = projectTags.filter(pTag => {
    if (!searchQuery) return true;
    if (pTag.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    // Or if any of its categories match
    const pCats = categoryTags.filter(cTag => cTag.parentId === pTag.id);
    return pCats.some(cTag => cTag.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const getProjectTodoCount = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;
    let count = 0;
    project.categoryIds.forEach(catId => {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        cat.planIds.forEach(planId => {
          const plan = plans.find(p => p.id === planId);
          if (plan?.todoId) count++;
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
      if (plan?.todoId) count++;
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

  const activeTagObj = tags.find(t => t.id === tagFilter);
  const totalTagsCount = projectTags.length + categoryTags.length;

  return (
    <div className="relative z-50 flex items-center" ref={menuRef}>
      {/* 1) 顶栏触发按钮 */}
      <button 
        className={clsx("tagfilter-trigger", showTagMenu || tagFilter ? "is-active" : "")}
        onClick={() => setShowTagMenu(!showTagMenu)}
      >
        <span className="lead">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41 13 21l-9-9V4h8l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <circle cx="8" cy="8" r="1.2"/>
          </svg>
        </span>
        <span>{activeTagObj ? activeTagObj.name : `全部标签`}</span>
        {activeTagObj && (
          <span className="pill">
            {activeTagObj.level === 'L1' ? getProjectTodoCount(activeTagObj.id) : getCategoryTodoCount(activeTagObj.id)}
          </span>
        )}
        <span className="caret">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </span>
      </button>

      {/* 2) 下拉面板 */}
      {showTagMenu && (
        <div className="tagfilter-panel" role="dialog" aria-label="按标签筛选">
          <div className="tfp-head">
            <span className="ttl">按标签筛选</span>
            <div className="actions">
              {tagFilter && (
                <button className="primary" onClick={() => { setTagFilter(null); setShowTagMenu(false); }}>清空</button>
              )}
            </div>
          </div>

          <div className="tfp-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
            </svg>
            <input 
              placeholder="搜索项目或分类…" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="tfp-list">
            {/* 全部标签 */}
            {(!searchQuery || '全部标签'.includes(searchQuery)) && (
              <button 
                className={clsx("tfp-row all", !tagFilter && "on")}
                onClick={() => { setTagFilter(null); setShowTagMenu(false); }}
              >
                <span className="dot-tag"></span>
                <span className="name">全部标签</span>
                <span className="cnt">{totalTagsCount}</span>
                <span className="tick">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
              </button>
            )}

            {filteredProjectTags.length > 0 && <div className="tfp-divider"></div>}

            {/* 项目和分类层级渲染 */}
            {filteredProjectTags.map(pTag => {
              const isExpanded = expandedProjects.has(pTag.id) || searchQuery;
              const pCats = categoryTags.filter(cTag => cTag.parentId === pTag.id);
              const pCatsFiltered = searchQuery 
                ? pCats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || pTag.name.toLowerCase().includes(searchQuery.toLowerCase()))
                : pCats;
              
              const isSelected = tagFilter === pTag.id;
              
              return (
                <div key={pTag.id}>
                  <div className="flex items-center w-full group">
                    <button
                      className="p-2 text-[var(--ink-4)] hover:text-[var(--ink-2)] transition-colors flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProject(pTag.id);
                      }}
                    >
                      <ChevronRight size={14} className={clsx("transition-transform", isExpanded && "rotate-90")} />
                    </button>
                    <button 
                      className={clsx("tfp-row !pl-1", isSelected && "on")}
                      onClick={() => { setTagFilter(pTag.id); setShowTagMenu(false); }}
                    >
                      <span className="dot-tag" style={{ background: TAG_TONES[pTag.tone] }}></span>
                      <span className="name">{pTag.name}</span>
                      <span className="cnt">{getProjectTodoCount(pTag.id)}</span>
                      <span className="tick">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </span>
                    </button>
                  </div>
                  
                  {isExpanded && pCatsFiltered.length > 0 && (
                    <div className="pl-6 border-l border-[var(--line-soft)] ml-3">
                      {pCatsFiltered.map(cTag => {
                        const isCatSelected = tagFilter === cTag.id;
                        return (
                          <button 
                            key={cTag.id}
                            className={clsx("tfp-row", isCatSelected && "on")}
                            onClick={() => { setTagFilter(cTag.id); setShowTagMenu(false); }}
                          >
                            <span className="dot-tag" style={{ background: TAG_TONES[cTag.tone] }}></span>
                            <span className="name">{cTag.name}</span>
                            <span className="cnt">{getCategoryTodoCount(cTag.id)}</span>
                            <span className="tick">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="tfp-foot">
            <button 
              className="manage"
              onClick={() => {
                setShowTagMenu(false);
                openTagModal();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
              </svg>
              <span>管理标签</span>
            </button>
            <span className="right">共 {totalTagsCount} 个标签</span>
          </div>
        </div>
      )}
    </div>
  );
}
