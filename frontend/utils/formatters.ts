import { Language } from '../translations';

/**
 * Formats a number as a currency string based on the user's base currency and language.
 * @param value The numeric value to format
 * @param currency The base currency code (e.g., 'EGP', 'USD')
 * @param language The current UI language ('en' or 'ar')
 * @returns A formatted currency string
 */
export const formatCurrency = (value: number, currency: string, language: Language): string => {
  try {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    console.error('Currency formatting failed:', e);
    return `${value.toLocaleString()} ${currency}`;
  }
};

/**
 * Formats a number with locale-aware grouping and decimals.
 * @param value The numeric value to format
 * @param language The current UI language ('en' or 'ar')
 * @returns A formatted number string
 */
export const formatNumber = (value: number, language: Language): string => {
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  return (value ?? 0).toLocaleString(locale);
};
