import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { useTodoStore } from '../../../store/todoStore';
import { useUIStore } from '../../../store/uiStore';
import { groupByDateForCalendar, filterTodos } from '../../../utils/todoUtils';
import {
  getCalendarDays, prevMonth, nextMonth, isSameMonthStr,
  isTodayStr, dateToStr,
} from '../../../utils/dateUtils';

export function CalendarView() {
  const { todos } = useTodoStore();
  const { searchQuery, calendarCurrentMonth, setCalendarMonth, openCreateModal, openEditModal } = useUIStore();

  const filtered = filterTodos(todos, searchQuery);
  const byDate = groupByDateForCalendar(filtered);
  const days = getCalendarDays(calendarCurrentMonth);

  return (
    <div className="content">
      <div className="cal-head">
        <div className="y">
          {new Date(calendarCurrentMonth).getFullYear()}
          <span className="m">{new Date(calendarCurrentMonth).toLocaleDateString('zh-CN', { month: 'long' })}</span>
        </div>
        <div className="seg">
          <button className="on">月</button>
          <button>周</button>
          <button>日</button>
        </div>
        <div className="nav">
          <button className="today" onClick={() => setCalendarMonth(dateToStr(new Date()).slice(0, 7))}>今天</button>
          <button onClick={() => setCalendarMonth(prevMonth(calendarCurrentMonth))}><ChevronLeft size={16}/></button>
          <button onClick={() => setCalendarMonth(nextMonth(calendarCurrentMonth))}><ChevronRight size={16}/></button>
        </div>
      </div>

      <div className="cal">
        <div className="cal-wkrow">
          <div>Mon 一</div>
          <div>Tue 二</div>
          <div>Wed 三</div>
          <div>Thu 四</div>
          <div>Fri 五</div>
          <div className="we">Sat 六</div>
          <div className="we">Sun 日</div>
        </div>
        <div className="cal-grid">
          {days.map((date, i) => {
            const dateStr = dateToStr(date);
            const isCurrentMonth = isSameMonthStr(dateStr, calendarCurrentMonth);
            const isToday = isTodayStr(dateStr);
            const we = i % 7 >= 5;
            const dayTodos = byDate[dateStr] ?? [];
            
            return (
              <div
                key={dateStr}
                onClick={() => openCreateModal(dateStr)}
                className={clsx('cal-cell', !isCurrentMonth && 'dim', we && 'we', isToday && 'today')}
              >
                <div className="d">{format(date, 'd')}</div>
                <div className="cal-evts">
                  {dayTodos.map(todo => (
                    <div
                      key={todo.id}
                      onClick={(e) => { e.stopPropagation(); openEditModal(todo.id); }}
                      className={clsx('cal-evt', todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warn' : 'info')}
                    >
                      <span className="name">{todo.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
