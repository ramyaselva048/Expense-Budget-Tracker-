import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, CreditCard, Repeat, FileText, RotateCcw } from 'lucide-react';
import { Category, Expense, Income, PaymentMethod, RecurrencePeriod, User } from '../types';
import { CURRENCY_CONFIGS } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'expense' | 'income';
  categories: Category[];
  user: User;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>, id?: number) => void;
  onSaveIncome: (income: Omit<Income, 'id' | 'created_at' | 'updated_at'>, id?: number) => void;
  initialExpense?: Expense | null;
  initialIncome?: Income | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  type: initialType,
  categories,
  user,
  onSaveExpense,
  onSaveIncome,
  initialExpense,
  initialIncome,
}) => {
  const [txType, setTxType] = useState<'expense' | 'income'>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [descriptionOrSource, setDescriptionOrSource] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<RecurrencePeriod>('monthly');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialExpense) {
      setTxType('expense');
      setAmount(initialExpense.amount.toString());
      setDescriptionOrSource(initialExpense.description);
      setCategoryId(initialExpense.category_id);
      setDate(initialExpense.date.slice(0, 10));
      setPaymentMethod(initialExpense.payment_method);
      setIsRecurring(initialExpense.is_recurring);
      setRecurrencePeriod(initialExpense.recurrence_period || 'monthly');
      setNotes(initialExpense.notes || '');
    } else if (initialIncome) {
      setTxType('income');
      setAmount(initialIncome.amount.toString());
      setDescriptionOrSource(initialIncome.source);
      setDate(initialIncome.date.slice(0, 10));
      setIsRecurring(initialIncome.is_recurring);
      setRecurrencePeriod(initialIncome.recurrence_period || 'monthly');
      setNotes(initialIncome.notes || '');
    } else {
      setTxType(initialType);
      setAmount('');
      setDescriptionOrSource('');
      const defaultCat = categories.find(c => c.type === initialType)?.id || categories[0]?.id || 1;
      setCategoryId(defaultCat);
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('Credit Card');
      setIsRecurring(false);
      setRecurrencePeriod('monthly');
      setNotes('');
    }
  }, [initialExpense, initialIncome, initialType, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const relevantCategories = categories.filter(c => c.type === txType);
  const currencySymbol = CURRENCY_CONFIGS[user.currency]?.symbol || '$';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (txType === 'expense') {
      onSaveExpense(
        {
          user_id: user.id,
          category_id: Number(categoryId),
          amount: parsedAmount,
          description: descriptionOrSource.trim() || 'Expense',
          date,
          is_recurring: isRecurring,
          recurrence_period: isRecurring ? recurrencePeriod : undefined,
          payment_method: paymentMethod,
          notes: notes.trim(),
        },
        initialExpense ? initialExpense.id : undefined
      );
    } else {
      onSaveIncome(
        {
          user_id: user.id,
          source: descriptionOrSource.trim() || 'Income',
          amount: parsedAmount,
          date,
          is_recurring: isRecurring,
          recurrence_period: isRecurring ? recurrencePeriod : undefined,
          notes: notes.trim(),
        },
        initialIncome ? initialIncome.id : undefined
      );
    }
    onClose();
  };

  const isEditing = Boolean(initialExpense || initialIncome);

  const handleResetForm = () => {
    if (initialExpense) {
      setAmount(initialExpense.amount.toString());
      setDescriptionOrSource(initialExpense.description);
      setCategoryId(initialExpense.category_id);
      setDate(initialExpense.date.slice(0, 10));
      setPaymentMethod(initialExpense.payment_method);
      setIsRecurring(initialExpense.is_recurring);
      setNotes(initialExpense.notes || '');
    } else if (initialIncome) {
      setAmount(initialIncome.amount.toString());
      setDescriptionOrSource(initialIncome.source);
      setDate(initialIncome.date.slice(0, 10));
      setIsRecurring(initialIncome.is_recurring);
      setNotes(initialIncome.notes || '');
    } else {
      setAmount('');
      setDescriptionOrSource('');
      setNotes('');
      setDate(new Date().toISOString().slice(0, 10));
      setIsRecurring(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isEditing ? `Edit ${txType === 'expense' ? 'Expense' : 'Income'}` : `Record New Transaction`}
            </h3>
            <p className="text-xs text-slate-500">
              {txType === 'expense' ? 'Track spending with categories & payment modes' : 'Log income inflow and earnings'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Switcher (only if creating new) */}
        {!isEditing && (
          <div className="px-5 sm:px-6 pt-3 pb-1 bg-white shrink-0">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTxType('expense');
                  const cat = categories.find(c => c.type === 'expense');
                  if (cat) setCategoryId(cat.id);
                }}
                className={`py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                  txType === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType('income');
                  const cat = categories.find(c => c.type === 'income');
                  if (cat) setCategoryId(cat.id);
                }}
                className={`py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                  txType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income (Inflow)
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form id="tx-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Amount ({user.currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                {currencySymbol}
              </span>
              <input
                id="tx-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xl font-bold rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Description or Source */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {txType === 'expense' ? 'Description / Payee *' : 'Income Source / Client *'}
            </label>
            <input
              id="tx-desc-input"
              type="text"
              required
              placeholder={txType === 'expense' ? 'e.g. Grocery Store, Rent, Coffee' : 'e.g. Monthly Salary, Freelance project'}
              value={descriptionOrSource}
              onChange={(e) => setDescriptionOrSource(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 text-sm"
            />
          </div>

          {/* Grid row: Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {txType === 'expense' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Category *
                </label>
                <select
                  id="tx-category-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 text-sm cursor-pointer"
                >
                  {relevantCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={txType === 'income' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date *
              </label>
              <input
                id="tx-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 text-sm cursor-pointer"
              />
            </div>
          </div>

          {/* Payment Method (Expenses only) */}
          {txType === 'expense' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment Method
              </label>
              <select
                id="tx-payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 text-sm cursor-pointer"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Recurring Option */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-slate-800">Recurring Transaction</span>
              </div>
              <input
                id="tx-is-recurring-check"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-amber-600 cursor-pointer rounded"
              />
            </div>

            {isRecurring && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600">Frequency:</span>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrencePeriod[]).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setRecurrencePeriod(period)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold capitalize transition cursor-pointer ${
                        recurrencePeriod === period
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes (Optional)
            </label>
            <input
              id="tx-notes-input"
              type="text"
              placeholder="Additional details, memo, or receipt tag..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 text-sm"
            />
          </div>
        </form>

        {/* Sticky Pinned Footer - Always Visible */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
              title="Reset fields to empty"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <button
            id="tx-save-btn"
            type="submit"
            form="tx-form"
            className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition cursor-pointer ${
              txType === 'expense'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isEditing ? 'Save Changes' : txType === 'expense' ? 'Record Expense' : 'Save Income'}
          </button>
        </div>
      </div>
    </div>
  );
};
