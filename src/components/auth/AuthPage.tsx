import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

import { useTodoStore } from '../../store/todoStore';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore(state => state.login);
  const fetchFromCloud = useTodoStore(state => state.fetchFromCloud);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) return;
    
    setIsLoading(true);
    
    // Simulate API Auth
    setTimeout(async () => {
      login({
        id: 'user-' + email.replace(/[^a-zA-Z0-9]/g, ''),
        email,
        name: isLogin ? email.split('@')[0] : name,
      });
      // After login, fetch the latest todos from our cloud!
      await fetchFromCloud();
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--bg)] p-6">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand)] text-[var(--brand-ink)] flex items-center justify-center text-3xl font-bold tracking-tighter shadow-lg shadow-[var(--brand)]/20">
            周
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--ink-1)] tracking-tight mb-1">周周待办</h1>
            <p className="text-sm text-[var(--ink-3)] font-medium tracking-wide">保持专注，高效完成</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-[var(--surface)] border border-[var(--line-soft)] rounded-2xl p-8 shadow-sm">
          <div className="flex gap-6 mb-8 border-b border-[var(--line-soft)]">
            <button
              onClick={() => setIsLogin(true)}
              className={clsx(
                'pb-3 text-sm font-semibold transition-colors relative',
                isLogin ? 'text-[var(--ink-1)]' : 'text-[var(--ink-4)] hover:text-[var(--ink-2)]'
              )}
            >
              密码登录
              {isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand)] rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={clsx(
                'pb-3 text-sm font-semibold transition-colors relative',
                !isLogin ? 'text-[var(--ink-1)]' : 'text-[var(--ink-4)] hover:text-[var(--ink-2)]'
              )}
            >
              注册新账号
              {!isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand)] rounded-t-full" />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--ink-2)] ml-1">昵称</label>
                <div className="relative flex items-center">
                  <UserIcon size={16} className="absolute left-3 text-[var(--ink-4)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="你的称呼"
                    className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface-2)] border border-transparent rounded-xl text-sm outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] transition-all placeholder:text-[var(--ink-4)] text-[var(--ink-1)]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--ink-2)] ml-1">邮箱</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-[var(--ink-4)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface-2)] border border-transparent rounded-xl text-sm outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] transition-all placeholder:text-[var(--ink-4)] text-[var(--ink-1)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--ink-2)] ml-1 flex justify-between">
                密码
                {isLogin && <a href="#" className="text-[var(--brand)] hover:underline font-medium">忘记密码？</a>}
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3 text-[var(--ink-4)]" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface-2)] border border-transparent rounded-xl text-sm outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] transition-all placeholder:text-[var(--ink-4)] text-[var(--ink-1)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password || (!isLogin && !name)}
              className="w-full mt-6 bg-[var(--brand)] text-[var(--brand-ink)] rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#243729] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-pulse">处理中...</span>
              ) : (
                <>
                  {isLogin ? '进入工作区' : '创建账号'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-xs text-[var(--ink-4)]">
            继续操作即代表同意周周待办的<br />
            <a href="#" className="text-[var(--ink-2)] hover:text-[var(--ink-1)] underline">服务条款</a> 和 <a href="#" className="text-[var(--ink-2)] hover:text-[var(--ink-1)] underline">隐私政策</a>
          </div>
        </div>
      </div>
    </div>
  );
}
