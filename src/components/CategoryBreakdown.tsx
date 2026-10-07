import { CATEGORY_COLORS } from '../lib/categories';
import { formatMoney, type CategoryTotal } from '../lib/finance';
import type { Category } from '../lib/types';

interface Props {
  data: CategoryTotal[];
  selected: Category[];
  onToggle: (category: Category) => void;
}

export function CategoryBreakdown({ data, selected, onToggle }: Props) {
  if (data.length === 0) {
    return <p className="empty">No spending in this selection.</p>;
  }
  return (
    <ul className="breakdown">
      {data.map((row) => {
        const isSelected = selected.includes(row.category);
        return (
          <li key={row.category}>
            <button
              type="button"
              className={isSelected ? 'breakdown-row selected' : 'breakdown-row'}
              aria-pressed={isSelected}
              onClick={() => onToggle(row.category)}
            >
              <span className="breakdown-head">
                <span className="dot" style={{ background: CATEGORY_COLORS[row.category] }} />
                <span className="breakdown-name">{row.category}</span>
                <span className="breakdown-amount">{formatMoney(row.totalCents)}</span>
                <span className="breakdown-share">{Math.round(row.share * 100)}%</span>
              </span>
              <span className="track">
                <span
                  className="fill"
                  style={{ width: `${row.share * 100}%`, background: CATEGORY_COLORS[row.category] }}
                />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
