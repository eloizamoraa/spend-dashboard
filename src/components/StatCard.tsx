interface Props {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative';
}

export function StatCard({ label, value, hint, tone = 'default' }: Props) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value tone-${tone}`}>{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
