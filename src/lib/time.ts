import { format, formatDistanceToNow, isToday, isYesterday, isThisYear } from "date-fns";
import { nb } from "date-fns/locale";

export function messageTime(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "I dag";
  if (isYesterday(d)) return "I går";
  return format(d, isThisYear(d) ? "d. MMMM" : "d. MMMM yyyy", { locale: nb });
}

export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: nb });
}

export function eventDateTime(iso: string): string {
  return format(new Date(iso), "EEE d. MMM 'kl.' HH:mm", { locale: nb });
}

export function eventDateShort(iso: string): { day: string; month: string; time: string } {
  const d = new Date(iso);
  return {
    day: format(d, "d"),
    month: format(d, "MMM", { locale: nb }),
    time: format(d, "HH:mm"),
  };
}

/** For a datetime-local input default value. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
