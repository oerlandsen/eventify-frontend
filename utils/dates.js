import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/es';
dayjs.extend(isoWeek);
dayjs.locale('es');

export const isToday = (d) => dayjs(d).isSame(dayjs(), 'day');
export const isTomorrow = (d) => dayjs(d).isSame(dayjs().add(1, 'day'), 'day');
export const isThisWeek = (d) => dayjs(d).isoWeek() === dayjs().isoWeek() && dayjs(d).isSame(dayjs(), 'year');
export const isThisMonth = (d) => dayjs(d).isSame(dayjs(), 'month');

export function formatLong(dateStr, timeStr) {
  const d = dayjs(dateStr);
  const t = timeStr ? `, ${timeStr}hrs` : '';
  return `${d.format('D')} ${d.format('MMMM')},${t}`; // “24 julio, 20:00hrs”
}
