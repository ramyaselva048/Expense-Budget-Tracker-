export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  currency: CurrencyCode;
  password?: string;
  created_at: string;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  created_at: string;
}

export type RecurrencePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'UPI' | 'PayPal' | 'Other';

export interface Expense {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  is_recurring: boolean;
  recurrence_period?: RecurrencePeriod;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: number;
  user_id: number;
  source: string;
  amount: number;
  date: string; // YYYY-MM-DD
  is_recurring: boolean;
  recurrence_period?: RecurrencePeriod;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  month: number; // 1 - 12
  year: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string; // YYYY-MM-DD
  is_completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  description: string;
  frequency: RecurrencePeriod;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialReport {
  id: number;
  user_id: number;
  report_type: 'monthly' | 'yearly';
  month: number;
  year: number;
  total_income: number;
  total_expenses: number;
  savings: number;
  report_data: string; // JSON string
  generated_at: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'expenses'
  | 'income'
  | 'budgets'
  | 'goals'
  | 'analytics'
  | 'reports';
