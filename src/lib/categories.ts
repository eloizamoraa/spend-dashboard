import type { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  Groceries: '#22a06b',
  Restaurants: '#f5853f',
  Transport: '#3d7bf7',
  Shopping: '#c45bd8',
  Entertainment: '#e5484d',
  Bills: '#8a8f98',
  Travel: '#12a5b8',
  Income: '#4c5bd4',
};

export const EXPENSE_CATEGORIES = (Object.keys(CATEGORY_COLORS) as Category[]).filter(
  (c) => c !== 'Income',
);
