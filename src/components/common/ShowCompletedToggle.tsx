import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '../../store/uiStore';

/** 月度规划 / 项目规划共用的「展示已完成」开关，状态存在 localStorage 里 */
export function ShowCompletedToggle() {
  const { showCompletedPlans, toggleShowCompletedPlans } = useUIStore();

  return (
    <button
      className={clsx('this-month show-done-toggle', showCompletedPlans && 'on')}
      onClick={toggleShowCompletedPlans}
      title={showCompletedPlans ? '隐藏已完成的规划事项' : '展示已完成的规划事项'}
    >
      <span className={clsx('box', showCompletedPlans && 'on')}>
        <Check size={10} strokeWidth={3} />
      </span>
      <span>展示已完成</span>
    </button>
  );
}
