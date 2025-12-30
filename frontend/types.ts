
export type AssetType = string;

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  isTwoFactorEnabled?: boolean;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
  twoFactorRequired?: boolean;
  challengeToken?: string;
  trustToken?: string;
}

export interface LoginDto {
  email: string;
  password?: string;
  trustToken?: string;
}

export interface LoginPinDto {
  email: string;
  pin: string;
  trustToken: string;
}

export interface Verify2FaDto {
  email: string;
  code: string;
  challengeToken: string;
  rememberDevice?: boolean;
  pin?: string;
}

export interface TwoFactorSetupDto {
  secret: string;
  qrCodeUri: string;
}

export interface TwoFactorVerifySetupDto {
  code: string;
  secret: string;
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
  userId?: number;
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
  baseCurrency: string;
  zakatAnniversaryDay?: number;
  zakatAnniversaryMonth?: number;
}

export interface ZakatCycle {
  id: number;
  hijriYear: string;
  gregorianDate: string;
  totalAssets: number;
  totalLiabilities: number;
  zakatDue: number;
  amountPaid: number;
  status: 'Open' | 'Calculating' | 'Due' | 'Paid';
  createdAt: string;
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
  zakatCycles: ZakatCycle[];
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
  zakatStartDate: string;
  lunarEndDate: string;
}
