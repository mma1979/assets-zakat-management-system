
export type AssetType = 'GOLD' | 'GOLD_21' | 'SILVER' | 'USD' | 'EGP';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  assetType: AssetType;
  amount: number; // Weight in grams for metals, Value for currency
  pricePerUnit: number; // Price in Base Currency (EGP) at time of transaction
  date: string; // ISO Date
  notes?: string;
}

export interface Liability {
  id: string;
  title: string;
  amount: number; // In EGP
  dueDate: string;
  isDeductible: boolean; // Is this a short-term debt deductible from Zakat?
}

export interface MarketRates {
  gold_egp: number; // Price per gram 24k
  gold21_egp: number; // Price per gram 21k
  silver_egp: number; // Price per gram
  usd_egp: number; // Exchange rate
  lastUpdated: number; // Timestamp
  dataSources?: { title?: string; uri?: string }[];
}

export interface AssetSummary {
  type: AssetType;
  totalQuantity: number;
  averageCost: number;
  currentValue: number;
  unrealizedGain: number;
}

export interface ZakatConfig {
  zakatDate: string; // ISO Date preference
  reminderEnabled?: boolean;
  email?: string;
}

export interface PriceAlert {
  id: string;
  assetType: AssetType;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  isActive: boolean;
}

export interface StoreData {
  transactions: Transaction[];
  liabilities: Liability[];
  rates: MarketRates;
  zakatConfig?: ZakatConfig;
  priceAlerts: PriceAlert[];
}

export interface ZakatCalculationResult {
  UserId: number;
  TotalAssets: number;
  TotalDebts: number;
  NetZakatBase: number;
  GlodAmount: number;
  TotalZakatDue: number;
}
