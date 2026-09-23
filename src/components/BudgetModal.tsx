import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
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
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const [categoryId, setCategoryId] = useState<number>(expenseCategories[0]?.id || 1);
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<number>(currentMonth);
  const [year, setYear] = useState<number>(currentYear);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialBudget) {
      setCategoryId(initialBudget.category_id);
      setAmount(initialBudget.amount.toString());
      setMonth(initialBudget.month);
      setYear(initialBudget.year);
      setNotes(initialBudget.notes || '');
    } else {
      setCategoryId(expenseCategories[0]?.id || 1);
      setAmount('');
      setMonth(currentMonth);
      setYear(currentYear);
      setNotes('');
    }
  }, [initialBudget, currentMonth, currentYear, isOpen, expenseCategories]);

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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Monthly Limit ({user.currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                {currencySymbol}
              </span>
              <input
                id="budget-amount-input"
                type="number"
                step="1"
                min="1"
                required
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xl font-bold rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-900"
              />
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
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
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
