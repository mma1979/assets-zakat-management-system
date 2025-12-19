import { Rate } from './types';

export const DEFAULT_RATES: Rate[] = [
  { id: 1, key: 'GOLD', value: 3500, lastUpdated: new Date().toISOString(), icon: 'Gem', title: 'Gold (24k)' },
  { id: 2, key: 'GOLD_21', value: 3000, lastUpdated: new Date().toISOString(), icon: 'Coins', title: 'Gold (21k)' },
  { id: 3, key: 'SILVER', value: 40, lastUpdated: new Date().toISOString(), icon: 'Coins', title: 'Silver' },
  { id: 4, key: 'USD', value: 48, lastUpdated: new Date().toISOString(), icon: 'DollarSign', title: 'US Dollar' },
];

export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;
export const ZAKAT_RATE = 0.025; // 2.5%

export const ASSET_LABELS: Record<string, string> = {
  GOLD: 'Gold (24k)',
  GOLD_21: 'Gold (21k)',
  SILVER: 'Silver',
  USD: 'US Dollar',
  EGP: 'Egyptian Pound',
};

export const ASSET_UNITS: Record<string, string> = {
  GOLD: 'g',
  GOLD_21: 'g',
  SILVER: 'g',
  USD: '$',
  EGP: 'EGP',
};