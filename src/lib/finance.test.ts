import { describe, expect, it } from 'vitest';
import {
  addDays,
  filterTransactions,
  formatMoney,
  groupByDay,
  monthlyTotals,
  parseAmountToCents,
  periodStart,
  spendingByCategory,
  summarize,
} from './finance';
import { DEFAULT_FILTERS, type Transaction } from './types';
import { generateSampleTransactions } from '../data/sampleTransactions';

const TODAY = '2026-10-07';

const txs: Transaction[] = [
  { id: '1', date: '2026-10-07', merchant: 'Mercadona', category: 'Groceries', amountCents: -2350 },
  { id: '2', date: '2026-10-06', merchant: 'TMB', category: 'Transport', amountCents: -240 },
  { id: '3', date: '2026-10-01', merchant: 'Salary', category: 'Income', amountCents: 145000 },
  { id: '4', date: '2026-09-15', merchant: 'Zara', category: 'Shopping', amountCents: -5999 },
  { id: '5', date: '2026-06-20', merchant: 'Vueling', category: 'Travel', amountCents: -12000 },
  { id: '6', date: '2026-10-08', merchant: 'Future', category: 'Groceries', amountCents: -100 },
];

describe('dates', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('computes inclusive period starts', () => {
    expect(periodStart('30d', TODAY)).toBe('2026-09-08');
    expect(periodStart('90d', TODAY)).toBe('2026-07-10');
    expect(periodStart('6m', TODAY)).toBe('2026-04-08');
    expect(periodStart('all', TODAY)).toBeNull();
  });
});

describe('filterTransactions', () => {
  it('drops transactions outside the period and in the future', () => {
    const result = filterTransactions(txs, { ...DEFAULT_FILTERS, period: '30d' }, TODAY);
    expect(result.map((t) => t.id)).toEqual(['1', '2', '3', '4']);
  });

  it('filters by kind', () => {
    const expenses = filterTransactions(txs, { ...DEFAULT_FILTERS, period: 'all', kind: 'expense' }, TODAY);
    expect(expenses.every((t) => t.amountCents < 0)).toBe(true);
    const income = filterTransactions(txs, { ...DEFAULT_FILTERS, period: 'all', kind: 'income' }, TODAY);
    expect(income.map((t) => t.id)).toEqual(['3']);
  });

  it('filters by category and case-insensitive merchant search', () => {
    const result = filterTransactions(
      txs,
      { ...DEFAULT_FILTERS, period: 'all', categories: ['Groceries', 'Transport'], query: '  merc ' },
      TODAY,
    );
    expect(result.map((t) => t.id)).toEqual(['1']);
  });
});

describe('aggregations', () => {
  it('summarizes spending and income in cents', () => {
    expect(summarize(txs.slice(0, 4))).toEqual({
      spentCents: 2350 + 240 + 5999,
      incomeCents: 145000,
      netCents: 145000 - 8589,
      count: 4,
    });
  });

  it('ranks categories by spending and ignores income', () => {
    const result = spendingByCategory(txs.slice(0, 5));
    expect(result.map((c) => c.category)).toEqual(['Travel', 'Shopping', 'Groceries', 'Transport']);
    expect(result.reduce((sum, c) => sum + c.share, 0)).toBeCloseTo(1, 10);
  });

  it('returns one bucket per month, including empty ones', () => {
    const result = monthlyTotals(txs, 6, TODAY);
    expect(result.map((m) => m.month)).toEqual([
      '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10',
    ]);
    expect(result[1].spentCents).toBe(12000);
    expect(result[2].spentCents).toBe(0);
    expect(result[5].incomeCents).toBe(145000);
  });

  it('groups by day, newest first', () => {
    const groups = groupByDay(txs.slice(0, 4));
    expect(groups.map((g) => g.date)).toEqual(['2026-10-07', '2026-10-06', '2026-10-01', '2026-09-15']);
  });
});

describe('formatting and parsing', () => {
  it('formats cents as euros', () => {
    expect(formatMoney(123456)).toBe('€1,234.56');
    expect(formatMoney(-2350, { signed: true })).toBe('-€23.50');
    expect(formatMoney(2350, { signed: true })).toBe('+€23.50');
  });

  it('parses amounts with dot or comma decimals', () => {
    expect(parseAmountToCents('12')).toBe(1200);
    expect(parseAmountToCents('12,5')).toBe(1250);
    expect(parseAmountToCents('0.10')).toBe(10);
    expect(parseAmountToCents('0')).toBeNull();
    expect(parseAmountToCents('12.345')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
  });
});

describe('sample data', () => {
  it('is deterministic for a given seed', () => {
    expect(generateSampleTransactions(TODAY)).toEqual(generateSampleTransactions(TODAY));
  });

  it('never generates transactions after today', () => {
    expect(generateSampleTransactions(TODAY).every((t) => t.date <= TODAY)).toBe(true);
  });
});
