import { Search, X, Plus, User as UserIcon, BarChart2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { VIEWS } from '../../types';
import { useEffect, useRef } from 'react';
import { TagFilter } from '../common/TagFilter';
import { DateFilter } from '../common/DateFilter';

export function Header() {
  const { currentView, searchQuery, setSearchQuery, openCreateModal, openAuthModal } = useUIStore();
  const { logout, user, isAuthenticated } = useAuthStore();
  const viewConfig = VIEWS.find(v => v.type === currentView);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N → new todo
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openCreateModal();
        return;
      }
      // "/" → focus search (when not already in an input)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [openCreateModal, isAuthenticated, openAuthModal]);

  return (
    <div className="topbar">
      <div className="crumb flex items-center gap-3 relative z-50">
        <h1>{viewConfig?.label}</h1>
        {currentView !== 'monthPlan' && <TagFilter />}
        <DateFilter />
      </div>

      <div className="search">
        <Search />
        <input
          ref={searchRef}
          type="text"
          placeholder="搜索待办…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-[13px] text-inherit w-full placeholder:text-[var(--ink-4)]"
        />
        {searchQuery ? (
          <button onClick={() => setSearchQuery('')} className="hover:text-[var(--ink-1)]">
            <X size={12} />
          </button>
        ) : (
          <kbd>/</kbd>
        )}
      </div>

      {isAuthenticated ? (
        <div className="flex items-center gap-2 relative group">
          <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-[var(--brand-ink)] flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer" title={user?.name}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          
          <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--surface)] border border-[var(--line-soft)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-[var(--line-soft)]">
              <div className="text-sm font-semibold text-[var(--ink-1)] truncate">{user?.name}</div>
              <div className="text-xs text-[var(--ink-3)] truncate">{user?.email}</div>
            </div>
            
            <div className="p-1">
              {user?.email === 'sanbai@qq.com' && (
                <a
                  href="?view=stats"
                  target="_blank"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--ink-2)] hover:text-[var(--brand)] hover:bg-[var(--hover)] rounded-lg transition-colors"
                >
                  <BarChart2 size={16} />
                  <span>数据统计</span>
                </a>
              )}
              <button
                onClick={logout}
                className="flex items-center justify-center w-full px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors"
              >
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={openAuthModal}
          className="flex items-center justify-center gap-1.5 px-4 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--line-soft)] text-[13px] font-medium text-[var(--ink-2)] hover:bg-[var(--hover)] hover:text-[var(--ink-1)] transition-colors"
        >
          <UserIcon size={14} />
          <span>登录</span>
        </button>
      )}

      <button
        onClick={() => openCreateModal()}
        title="新建待办 (⌘N)"
        className="primary-btn"
      >
        <Plus />
        <span>新建</span>
      </button>
    </div>
  );
}
