import { useLayoutEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface AutoGrowTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  className?: string;
}

/**
 * 就地编辑标题用的输入框。用 textarea 代替 input，长文案会自动换行并把高度撑开，
 * 不会像单行 input 那样把看不下的内容藏起来。回车提交，Esc 取消，所以标题里
 * 不会真的出现换行符。
 */
export function AutoGrowTextarea({
  value, onChange, onSubmit, onCancel, className,
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // 每次内容变化都重新量一次：先归零再按 scrollHeight 撑开，否则删字时收不回去
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    // 光标落到末尾，而不是把已有标题整段选中
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  return (
    <textarea
      ref={ref}
      rows={1}
      className={clsx('inline-edit', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onSubmit}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
    />
  );
}
