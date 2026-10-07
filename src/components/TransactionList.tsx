import { useState } from 'react';
import { CATEGORY_COLORS } from '../lib/categories';
import { formatMoney, groupByDay, parseISODate } from '../lib/finance';
import type { Transaction } from '../lib/types';

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

interface Props {
  transactions: Transaction[];
  today: string;
  pageSize?: number;
}

function dayLabel(date: string, today: string): string {
  if (date === today) return 'Today';
  const diff = (parseISODate(today).getTime() - parseISODate(date).getTime()) / 86_400_000;
  if (diff === 1) return 'Yesterday';
  return dayFormat.format(parseISODate(date));
}

export function TransactionList({ transactions, today, pageSize = 20 }: Props) {
  const [limit, setLimit] = useState(pageSize);
  const groups = groupByDay(transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit));

  if (groups.length === 0) {
    return <p className="empty">No transactions match these filters.</p>;
  }

  return (
    <div className="tx-list">
      {groups.map((group) => (
        <section key={group.date} aria-label={dayLabel(group.date, today)}>
          <h3 className="tx-day">{dayLabel(group.date, today)}</h3>
          <ul>
            {group.items.map((tx) => (
              <li key={tx.id} className="tx">
                <span
                  className="tx-avatar"
                  style={{ background: `${CATEGORY_COLORS[tx.category]}1f`, color: CATEGORY_COLORS[tx.category] }}
                  aria-hidden
                >
                  {tx.merchant.charAt(0)}
                </span>
                <span className="tx-main">
                  <span className="tx-merchant">{tx.merchant}</span>
                  <span className="tx-category">{tx.category}</span>
                </span>
                <span className={tx.amountCents > 0 ? 'tx-amount income' : 'tx-amount'}>
                  {formatMoney(tx.amountCents, { signed: true })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {transactions.length > limit && (
        <div className="more">
          <span className="muted small">
            Showing {limit} of {transactions.length}
          </span>
          <button type="button" className="btn ghost" onClick={() => setLimit((l) => l + pageSize)}>
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
