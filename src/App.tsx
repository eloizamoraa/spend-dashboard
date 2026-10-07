import { useEffect, useMemo, useState } from 'react';
import { AddTransactionForm } from './components/AddTransactionForm';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { MonthlyChart } from './components/MonthlyChart';
import { Segmented } from './components/Segmented';
import { StatCard } from './components/StatCard';
import { TransactionList } from './components/TransactionList';
import { generateSampleTransactions } from './data/sampleTransactions';
import { EXPENSE_CATEGORIES } from './lib/categories';
import {
  filterTransactions,
  formatMoney,
  monthlyTotals,
  spendingByCategory,
  summarize,
  toISODate,
} from './lib/finance';
import { DEFAULT_FILTERS, type Category, type Filters, type Kind, type Period, type Transaction } from './lib/types';

const STORAGE_KEY = 'spend-dashboard:custom-transactions';

function loadCustom(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

const PERIODS: { value: Period; label: string }[] = [
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '6m', label: '6M' },
  { value: 'all', label: 'All' },
];

const KINDS: { value: Kind; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
];

export default function App() {
  const today = useMemo(() => toISODate(new Date()), []);
  const sample = useMemo(() => generateSampleTransactions(today), [today]);
  const [custom, setCustom] = useState<Transaction[]>(loadCustom);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch {
      /* storage unavailable (private mode): keep working in memory */
    }
  }, [custom]);

  const all = useMemo(() => [...sample, ...custom], [sample, custom]);
  const filtered = useMemo(() => filterTransactions(all, filters, today), [all, filters, today]);
  const summary = useMemo(() => summarize(filtered), [filtered]);
  const byCategory = useMemo(() => spendingByCategory(filtered), [filtered]);

  // The monthly chart ignores the period filter (it always shows 6 months) but respects the rest.
  const months = useMemo(
    () => monthlyTotals(filterTransactions(all, { ...filters, period: 'all' }, today), 6, today),
    [all, filters, today],
  );

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggleCategory = (c: Category) =>
    update({
      categories: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });

  const days = filters.period === '30d' ? 30 : filters.period === '90d' ? 90 : null;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>Spend</span>
        </div>
        <Segmented label="Period" options={PERIODS} value={filters.period} onChange={(period) => update({ period })} />
      </header>

      <main>
        <section className="stats" aria-label="Summary">
          <StatCard
            label="Spent"
            value={formatMoney(summary.spentCents)}
            hint={days ? `${formatMoney(Math.round(summary.spentCents / days))} / day` : undefined}
          />
          <StatCard label="Income" value={formatMoney(summary.incomeCents)} tone="positive" />
          <StatCard
            label="Net"
            value={formatMoney(summary.netCents, { signed: true })}
            tone={summary.netCents >= 0 ? 'positive' : 'negative'}
          />
          <StatCard label="Transactions" value={summary.count.toLocaleString('en-GB')} />
        </section>

        <section className="grid">
          <div className="card">
            <h2>Monthly spending</h2>
            <MonthlyChart data={months} />
          </div>
          <div className="card">
            <div className="card-head">
              <h2>By category</h2>
              {filters.categories.length > 0 && (
                <button type="button" className="link" onClick={() => update({ categories: [] })}>
                  Clear
                </button>
              )}
            </div>
            <CategoryBreakdown data={byCategory} selected={filters.categories} onToggle={toggleCategory} />
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Transactions</h2>
            {!adding && (
              <button type="button" className="btn primary" onClick={() => setAdding(true)}>
                + Add expense
              </button>
            )}
          </div>

          {adding && (
            <AddTransactionForm
              today={today}
              onCancel={() => setAdding(false)}
              onAdd={(tx) => {
                setCustom((c) => [...c, tx]);
                setAdding(false);
              }}
            />
          )}

          <div className="filters">
            <input
              type="search"
              className="search"
              placeholder="Search merchants"
              aria-label="Search merchants"
              value={filters.query}
              onChange={(e) => update({ query: e.target.value })}
            />
            <Segmented label="Type" options={KINDS} value={filters.kind} onChange={(kind) => update({ kind })} />
          </div>
          <div className="chips" role="group" aria-label="Categories">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={filters.categories.includes(c) ? 'chip active' : 'chip'}
                aria-pressed={filters.categories.includes(c)}
                onClick={() => toggleCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <TransactionList transactions={filtered} today={today} />
        </section>
      </main>

      <footer className="muted small center">Demo data, generated locally. Nothing leaves your browser.</footer>
    </div>
  );
}
