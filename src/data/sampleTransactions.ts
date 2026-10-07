import { addDays } from '../lib/finance';
import type { Category, Transaction } from '../lib/types';

/** Small deterministic PRNG so the demo data is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Spec {
  category: Category;
  merchants: string[];
  /** Range in euros. */
  min: number;
  max: number;
  /** Expected occurrences per day. */
  perDay: number;
}

const SPECS: Spec[] = [
  { category: 'Groceries', merchants: ['Mercadona', 'Lidl', 'Bonpreu', 'Carrefour Express'], min: 6, max: 58, perDay: 0.45 },
  { category: 'Restaurants', merchants: ['Honest Greens', 'Bar La Plaça', 'Sushi Shop', 'Five Guys', 'Café de l’Òpera'], min: 4, max: 36, perDay: 0.4 },
  { category: 'Transport', merchants: ['TMB', 'Renfe', 'Cabify', 'Bicing'], min: 1.5, max: 22, perDay: 0.35 },
  { category: 'Shopping', merchants: ['Zara', 'Decathlon', 'Amazon', 'FNAC'], min: 12, max: 90, perDay: 0.08 },
  { category: 'Entertainment', merchants: ['Cines Verdi', 'Steam', 'Razzmatazz', 'Spotify'], min: 5, max: 40, perDay: 0.07 },
  { category: 'Travel', merchants: ['Vueling', 'Booking.com', 'Ouigo'], min: 35, max: 180, perDay: 0.02 },
];

const MONTHLY: { day: number; merchant: string; category: Category; euros: number }[] = [
  { day: 1, merchant: 'Salary', category: 'Income', euros: 1450 },
  { day: 3, merchant: 'Digi Mobil', category: 'Bills', euros: -15 },
  { day: 5, merchant: 'Iberdrola', category: 'Bills', euros: -48.6 },
  { day: 8, merchant: 'Gym Membership', category: 'Bills', euros: -34.9 },
  { day: 12, merchant: 'Netflix', category: 'Entertainment', euros: -12.99 },
];

export function generateSampleTransactions(today: string, days = 210, seed = 42): Transaction[] {
  const rand = mulberry32(seed);
  const txs: Transaction[] = [];
  let n = 0;
  const id = () => `tx_${(++n).toString(36)}`;

  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const dayOfMonth = Number(date.slice(8, 10));

    for (const m of MONTHLY) {
      if (m.day === dayOfMonth) {
        txs.push({ id: id(), date, merchant: m.merchant, category: m.category, amountCents: Math.round(m.euros * 100) });
      }
    }

    for (const spec of SPECS) {
      if (rand() < spec.perDay) {
        const euros = spec.min + rand() * (spec.max - spec.min);
        txs.push({
          id: id(),
          date,
          merchant: spec.merchants[Math.floor(rand() * spec.merchants.length)],
          category: spec.category,
          amountCents: -Math.round(euros * 100),
        });
      }
    }
  }
  return txs;
}
