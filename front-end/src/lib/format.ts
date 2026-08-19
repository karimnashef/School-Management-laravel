export function fmtDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(value?: string | null): string {
  if (!value) return '-';
  return value.slice(0, 5);
}

export function fmtPct(value?: number | null): string {
  if (value === null || value === undefined) return '-';
  return `${Number(value).toFixed(2)}%`;
}

export function fmtMoney(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function gradeLetterTone(letter: string): string {
  if (letter === 'A' || letter === 'B') return 'green';
  if (letter === 'C') return 'blue';
  if (letter === 'D') return 'amber';
  return 'red';
}