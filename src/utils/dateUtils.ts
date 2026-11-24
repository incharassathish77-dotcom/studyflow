export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysStr(dateStr: string, delta: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + delta);
  return formatDateStr(d);
}

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = parseLocalDate(fromDateStr);
  const to = parseLocalDate(toDateStr);
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'No date';
  const date = parseLocalDate(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatTime12h(time24: string): string {
  if (!time24 || !/^\d{2}:\d{2}$/.test(time24)) return time24;
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

export function getWeekStartDateStr(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return formatDateStr(d);
}

export function getLastNDays(n: number): string[] {
  const today = getTodayStr();
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    result.push(addDaysStr(today, -i));
  }
  return result;
}

export function calcDurationMinutes(startTime: string, endTime: string): number {
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}
