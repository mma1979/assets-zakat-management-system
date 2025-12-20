
export type AssetType = string;

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

export interface Rate {
  id: number;
  key: string;
  value: number;
  lastUpdated: string;
  icon: string;
  title: string;
  order?: number;
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
  geminiApiKey?: string;
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
  rates: Rate[];
  zakatConfig?: ZakatConfig;
  priceAlerts: PriceAlert[];
}

export interface ZakatCalculationResult {
  userId: number;
  totalAssets: number;
  totalDebts: number;
  netZakatBase: number;
  glodAmount: number;
  totalZakatDue: number;
  nisabGoldValue: number;
  nisabSilverValue: number;
  lunarEndDate: string;
}
