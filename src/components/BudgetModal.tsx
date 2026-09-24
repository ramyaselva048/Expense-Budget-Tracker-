import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, RotateCcw } from 'lucide-react';
import { Budget, Category, User } from '../types';
import { CURRENCY_CONFIGS, formatMonthYear } from '../utils/formatters';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  user: User;
  onSaveBudget: (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>, id?: number) => void;
  initialBudget?: Budget | null;
  currentMonth: number;
  currentYear: number;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  user,
  onSaveBudget,
  initialBudget,
  currentMonth,
  currentYear,
}) => {
  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === 'expense'),
    [categories]
  );

  const [categoryId, setCategoryId] = useState<number>(expenseCategories[0]?.id || 1);
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<number>(currentMonth);
  const [year, setYear] = useState<number>(currentYear);
  const [notes, setNotes] = useState<string>('');

  // Reset or initialize ONLY when modal opens or initialBudget changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialBudget) {
      setCategoryId(initialBudget.category_id);
      setAmount(initialBudget.amount ? String(initialBudget.amount) : '');
      setMonth(initialBudget.month);
      setYear(initialBudget.year);
      setNotes(initialBudget.notes || '');
    } else {
      const defaultCat = categories.find(c => c.type === 'expense')?.id || categories[0]?.id || 1;
      setCategoryId(defaultCat);
      setAmount('');
      setMonth(currentMonth);
      setYear(currentYear);
      setNotes('');
    }
  }, [isOpen, initialBudget]);

  const handleResetForm = () => {
    const defaultCat = categories.find(c => c.type === 'expense')?.id || categories[0]?.id || 1;
    setCategoryId(defaultCat);
    setAmount('');
    setMonth(currentMonth);
    setYear(currentYear);
    setNotes('');
  };

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

  const currencySymbol = CURRENCY_CONFIGS[user.currency]?.symbol || '$';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSaveBudget(
      {
        user_id: user.id,
        category_id: Number(categoryId),
        amount: parsedAmount,
        month: Number(month),
        year: Number(year),
        notes: notes.trim(),
      },
      initialBudget?.id
    );
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {initialBudget ? 'Edit Monthly Budget' : 'Set Category Budget'}
            </h3>
            <p className="text-xs text-slate-500">Plan and cap spending for {formatMonthYear(year, month)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="budget-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Expense Category *
            </label>
            <select
              id="budget-category-select"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 text-sm cursor-pointer"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="budget-amount-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Monthly Limit ({user.currency}) *
              </label>
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg select-none">
                {currencySymbol}
              </span>
              <input
                id="budget-amount-input"
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-xl font-bold rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900 bg-white"
              />
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  title="Clear amount"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick preset buttons for instant budget setting */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Quick set:</span>
              {[100, 250, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200 transition cursor-pointer"
                >
                  {currencySymbol}{preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 font-medium cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1, 1).toLocaleString(undefined, { month: 'short' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes / Strategy
            </label>
            <input
              type="text"
              placeholder="e.g. Keep groceries within limit, buy bulk..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        </form>

        {/* Sticky Pinned Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-2 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center gap-1"
              title="Reset all inputs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <button
            id="budget-submit-btn"
            type="submit"
            form="budget-form"
            className="px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            {initialBudget ? 'Update Budget' : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>
  );
};

