import { useState, type FormEvent } from 'react';
import { EXPENSE_CATEGORIES } from '../lib/categories';
import { parseAmountToCents } from '../lib/finance';
import type { Category, Transaction } from '../lib/types';

interface Props {
  today: string;
  onAdd: (tx: Transaction) => void;
  onCancel: () => void;
}

export function AddTransactionForm({ today, onAdd, onCancel }: Props) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Groceries');
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cents = parseAmountToCents(amount);
    if (!merchant.trim()) return setError('Add a merchant name.');
    if (cents === null) return setError('Enter a positive amount, e.g. 12.50');
    if (date > today) return setError('The date can’t be in the future.');

    onAdd({
      id: crypto.randomUUID(),
      date,
      merchant: merchant.trim(),
      category,
      amountCents: -cents,
    });
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} noValidate>
      <label>
        Merchant
        <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Mercadona" autoFocus />
      </label>
      <label>
        Amount (€)
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
      </label>
      <label>
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Date
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary">
          Add expense
        </button>
      </div>
    </form>
  );
}
