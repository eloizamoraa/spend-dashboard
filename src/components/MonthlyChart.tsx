import { useState } from 'react';
import { formatMoney, parseISODate, type MonthTotal } from '../lib/finance';

const WIDTH = 560;
const HEIGHT = 220;
const PAD = { top: 16, right: 8, bottom: 28, left: 8 };

const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });

interface Props {
  data: MonthTotal[];
}

/** Hand-rolled SVG bar chart: no chart library, fully responsive via viewBox. */
export function MonthlyChart({ data }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.spentCents));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.min(44, slot * 0.56);
  const active = hovered ?? data.length - 1;

  return (
    <div className="chart">
      <div className="chart-readout" aria-live="polite">
        <span className="chart-readout-value">{formatMoney(data[active]?.spentCents ?? 0)}</span>
        <span className="muted">
          spent in{' '}
          {data[active] &&
            new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
              parseISODate(`${data[active].month}-01`),
            )}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Spending per month"
        onMouseLeave={() => setHovered(null)}
      >
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            className="gridline"
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + innerH * (1 - t)}
            y2={PAD.top + innerH * (1 - t)}
          />
        ))}
        {data.map((d, i) => {
          const h = Math.max(2, (d.spentCents / max) * innerH);
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const y = PAD.top + innerH - h;
          return (
            <g key={d.month} onMouseEnter={() => setHovered(i)}>
              <rect className="hit" x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} />
              <rect
                className={i === active ? 'bar active' : 'bar'}
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={6}
              >
                <title>{`${d.month}: ${formatMoney(d.spentCents)}`}</title>
              </rect>
              <text className="axis-label" x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle">
                {monthLabel.format(parseISODate(`${d.month}-01`))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
