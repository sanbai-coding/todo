import {
  format, isToday, isTomorrow, isYesterday, isPast, isFuture,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  parseISO, addMonths, subMonths,
  addDays,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const TODAY = () => format(new Date(), 'yyyy-MM-dd');

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  if (isYesterday(date)) return '昨天';
  return format(date, 'M月d日 EEEE', { locale: zhCN });
}

export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  return format(date, 'M/d', { locale: zhCN });
}

export function formatMonthYear(dateStr: string): string {
  return format(parseISO(dateStr + '-01'), 'yyyy年M月', { locale: zhCN });
}

export function isOverdue(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

export function getCalendarDays(monthStr: string): Date[] {
  const monthDate = parseISO(monthStr + '-01');
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthStr(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function prevMonth(monthStr: string): string {
  return getMonthStr(subMonths(parseISO(monthStr + '-01'), 1));
}

export function nextMonth(monthStr: string): string {
  return getMonthStr(addMonths(parseISO(monthStr + '-01'), 1));
}

export function isSameDayStr(a: string, b: string): boolean {
  return a === b;
}

export function isSameMonthStr(dateStr: string, monthStr: string): boolean {
  return dateStr.startsWith(monthStr);
}

export function isTodayStr(dateStr: string): boolean {
  return isToday(parseISO(dateStr));
}

export function isFutureStr(dateStr: string): boolean {
  return isFuture(parseISO(dateStr)) || isToday(parseISO(dateStr));
}

export function dateToStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getNext7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => dateToStr(addDays(today, i)));
}

export function getDayLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  return format(date, 'EEEE M月d日', { locale: zhCN });
}

export function getWeekdayHeaders(): string[] {
  return ['一', '二', '三', '四', '五', '六', '日'];
}
