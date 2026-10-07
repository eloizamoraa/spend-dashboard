export const CATEGORIES = [
  'Groceries',
  'Restaurants',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Travel',
  'Income',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Transaction {
  id: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  merchant: string;
  category: Category;
  /** Signed amount in cents: negative = expense, positive = income. */
  amountCents: number;
}

export type Period = '30d' | '90d' | '6m' | 'all';
export type Kind = 'all' | 'expense' | 'income';

export interface Filters {
  query: string;
  categories: Category[];
  period: Period;
  kind: Kind;
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  categories: [],
  period: '90d',
  kind: 'all',
};
