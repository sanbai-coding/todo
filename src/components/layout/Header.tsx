import { Search, X, Plus, LogOut, User as UserIcon } from 'lucide-react';
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
        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            title={`退出登录 (${user?.name})`}
            className="icon-btn hover:!text-[var(--danger)]"
          >
            <LogOut />
          </button>
          <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-[var(--brand-ink)] flex items-center justify-center font-bold text-sm shadow-sm cursor-default" title={user?.name}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
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
