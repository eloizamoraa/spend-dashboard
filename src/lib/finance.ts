import type { Category, Filters, Period, Transaction } from './types';

/* ---------- dates ---------- */

/** Parses YYYY-MM-DD as a UTC date so results never depend on the user's time zone. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

/** First day (inclusive) covered by a period, or null for "all". */
export function periodStart(period: Period, today: string): string | null {
  switch (period) {
    case '30d':
      return addDays(today, -29);
    case '90d':
      return addDays(today, -89);
    case '6m': {
      const d = parseISODate(today);
      d.setUTCMonth(d.getUTCMonth() - 6);
      return addDays(toISODate(d), 1);
    }
    case 'all':
      return null;
  }
}

/* ---------- filtering ---------- */

export function filterTransactions(
  txs: Transaction[],
  filters: Filters,
  today: string,
): Transaction[] {
  const start = periodStart(filters.period, today);
  const query = filters.query.trim().toLowerCase();

  return txs.filter((tx) => {
    if (start && tx.date < start) return false;
    if (tx.date > today) return false;
    if (filters.kind === 'expense' && tx.amountCents >= 0) return false;
    if (filters.kind === 'income' && tx.amountCents <= 0) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(tx.category)) return false;
    if (query && !tx.merchant.toLowerCase().includes(query)) return false;
    return true;
  });
}

/* ---------- aggregations ---------- */

export interface Summary {
  spentCents: number;
  incomeCents: number;
  netCents: number;
  count: number;
}

export function summarize(txs: Transaction[]): Summary {
  let spentCents = 0;
  let incomeCents = 0;
  for (const tx of txs) {
    if (tx.amountCents < 0) spentCents += -tx.amountCents;
    else incomeCents += tx.amountCents;
  }
  return { spentCents, incomeCents, netCents: incomeCents - spentCents, count: txs.length };
}

export interface CategoryTotal {
  category: Category;
  totalCents: number;
  /** Share of total spending, 0–1. */
  share: number;
}

/** Spending per category, largest first. Income is ignored. */
export function spendingByCategory(txs: Transaction[]): CategoryTotal[] {
  const totals = new Map<Category, number>();
  for (const tx of txs) {
    if (tx.amountCents >= 0) continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) - tx.amountCents);
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([category, totalCents]) => ({
      category,
      totalCents,
      share: grand === 0 ? 0 : totalCents / grand,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export interface MonthTotal {
  /** YYYY-MM */
  month: string;
  spentCents: number;
  incomeCents: number;
}

/** Totals for the last `months` calendar months up to `today`, oldest first; empty months included. */
export function monthlyTotals(txs: Transaction[], months: number, today: string): MonthTotal[] {
  const end = parseISODate(today);
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    keys.push(toISODate(d).slice(0, 7));
  }
  const buckets = new Map<string, MonthTotal>(
    keys.map((month) => [month, { month, spentCents: 0, incomeCents: 0 }]),
  );
  for (const tx of txs) {
    const bucket = buckets.get(tx.date.slice(0, 7));
    if (!bucket) continue;
    if (tx.amountCents < 0) bucket.spentCents -= tx.amountCents;
    else bucket.incomeCents += tx.amountCents;
  }
  return keys.map((k) => buckets.get(k)!);
}

/** Groups transactions by date, newest day first, keeping order within a day. */
export function groupByDay(txs: Transaction[]): { date: string; items: Transaction[] }[] {
  const groups = new Map<string, Transaction[]>();
  for (const tx of [...txs].sort((a, b) => b.date.localeCompare(a.date))) {
    const list = groups.get(tx.date);
    if (list) list.push(tx);
    else groups.set(tx.date, [tx]);
  }
  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

/* ---------- formatting ---------- */

const moneyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, opts: { signed?: boolean; currency?: string } = {}): string {
  const currency = opts.currency ?? 'EUR';
  const key = `${currency}:${opts.signed ? 1 : 0}`;
  let fmt = moneyFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      signDisplay: opts.signed ? 'exceptZero' : 'auto',
    });
    moneyFormatters.set(key, fmt);
  }
  return fmt.format(cents / 100);
}

/** Parses user input like "12", "12.5" or "12,50" into cents. Returns null if invalid or not positive. */
export function parseAmountToCents(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}
