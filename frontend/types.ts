
export type AssetType = string;

export interface UserProfile {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface Transaction {
  id: number;
  type: 'BUY' | 'SELL';
  assetType: AssetType;
  amount: number; // Weight in grams for metals, Value for currency
  pricePerUnit: number; // Price in Base Currency (EGP) at time of transaction
  date: string; // ISO Date
  notes?: string;
}

export interface Liability {
  id: number;
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
  id: number;
  assetType: AssetType;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  isActive: boolean;
}

export interface ZakatPayment {
  id: number;
  amount: number;
  date: string;
  notes?: string;
}

export interface StoreData {
  transactions: Transaction[];
  liabilities: Liability[];
  rates: Rate[];
  zakatConfig: ZakatConfig;
  priceAlerts: PriceAlert[];
  zakatPayments: ZakatPayment[];
}

export interface ZakatCalculationResult {
  totalAssets: number;
  totalDebts: number;
  netZakatBase: number;
  totalZakatDue: number;
  totalPayments: number;
  remainingZakatDue: number;
  nisabGoldValue: number;
  nisabSilverValue: number;
  lunarEndDate: string;
}
