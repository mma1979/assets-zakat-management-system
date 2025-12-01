import { MarketRates } from './types';

export const DEFAULT_RATES: MarketRates = {
  gold_egp: 3500, // Fallback default 24k
  gold21_egp: 3000, // Fallback default 21k
  silver_egp: 40,
  usd_egp: 48,
  lastUpdated: Date.now(),
  dataSources: [],
};

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