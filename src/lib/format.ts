const dateFmt = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export const formatDate = (d: Date) => dateFmt.format(d);
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** "2 days ago", "3 months ago" — computed at build time. */
export function timeAgo(input: string | Date, now = new Date()): string {
  const seconds = (now.valueOf() - new Date(input).valueOf()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(-Math.round(seconds / size), unit);
  }
  return 'just now';
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Strip Markdown syntax for excerpts and search indexing. */
export function plainText(markdown: string | undefined): string {
  return (markdown ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^>\s*\[![A-Z]+\]/gm, ' ')
    .replace(/[#>*_~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 2024 → "2024", "2026-06" → "Jun 2026", "2024-03-15" → "Mar 15, 2024". */
export function formatPartialDate(value: string | number): string {
  const [y, m, d] = String(value).split('-');
  if (!m) return y ?? '';
  const month = MONTHS[Number(m) - 1] ?? m;
  return d ? `${month} ${Number(d)}, ${y}` : `${month} ${y}`;
}

/** Earliest instant a partial date refers to (or the last, with `end`). Used for sorting / expiry. */
export function partialToDate(value: string | number, end = false): Date {
  const [y = 1970, m, d] = String(value).split('-').map(Number);
  if (!end) return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  if (d) return new Date(Date.UTC(y, (m ?? 1) - 1, d, 23, 59, 59));
  return new Date(Date.UTC(m ? y : y + 1, m ?? 0, 1) - 1);
}
