import { CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'USD ($)' },
  INR: { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  CAD: { code: 'CAD', symbol: 'C$', label: 'CAD (C$)' },
  AUD: { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  JPY: { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formattedNumber = absAmount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  });

  return `${isNegative ? '-' : ''}${config.symbol}${formattedNumber}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
