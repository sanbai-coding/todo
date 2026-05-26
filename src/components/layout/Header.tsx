import { Search, Sun, Moon, X, Plus, LogOut } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { VIEWS } from '../../types';
import { useEffect, useRef } from 'react';

export function Header() {
  const { currentView, isDarkMode, toggleDarkMode, searchQuery, setSearchQuery, openCreateModal } = useUIStore();
  const { logout, user } = useAuthStore();
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
  }, [openCreateModal]);

  return (
    <div className="topbar">
      <div className="crumb">
        <h1>{viewConfig?.label}</h1>
        {/* You can add dynamic subtitle here if needed */}
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

      <button
        onClick={toggleDarkMode}
        title={isDarkMode ? '切换浅色模式' : '切换深色模式'}
        className="icon-btn"
      >
        {isDarkMode ? <Sun /> : <Moon />}
      </button>

      <button
        onClick={logout}
        title={`退出登录 (${user?.name})`}
        className="icon-btn hover:!text-[var(--danger)]"
      >
        <LogOut />
      </button>

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
