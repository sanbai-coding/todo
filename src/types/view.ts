export type ViewType = 'timeline' | 'status' | 'calendar' | 'quadrant' | 'monthPlan';

export interface ViewConfig {
  type: ViewType;
  label: string;
  icon: string;
}

export const VIEWS: ViewConfig[] = [
  { type: 'timeline', label: '每日待办', icon: 'CalendarDays' },
  { type: 'status', label: '状态看板', icon: 'Kanban' },
  { type: 'calendar', label: '月历视图', icon: 'Calendar' },
  { type: 'quadrant', label: '四象限', icon: 'LayoutGrid' },
  { type: 'monthPlan', label: '月度规划', icon: 'Target' },
];
