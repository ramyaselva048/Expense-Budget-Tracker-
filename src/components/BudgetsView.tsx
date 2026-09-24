import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  PieChart, 
  Edit3, 
  Trash2, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Budget, Category, Expense, User } from '../types';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetsViewProps {
  user: User;
  budgets: Budget[];
  categories: Category[];
  expenses: Expense[];
  onOpenNewBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: number) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  user,
  budgets,
  categories,
  expenses,
  onOpenNewBudget,
  onEditBudget,
  onDeleteBudget,
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Expenses for the selected month/year
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date + (e.date.includes('T') ? '' : 'T00:00:00'));
      return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
    });
  }, [expenses, selectedMonth, selectedYear]);

  // Budgets for the selected month/year
  const activeBudgets = useMemo(() => {
    return budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
  }, [budgets, selectedMonth, selectedYear]);

  // Detailed budget calculation
  const budgetDetails = useMemo(() => {
    return activeBudgets.map(b => {
      const cat = categoryMap.get(b.category_id);
      const spent = monthExpenses
        .filter(e => e.category_id === b.category_id)
        .reduce((sum, e) => sum + e.amount, 0);

      const percent = Math.round((spent / b.amount) * 100);
      const remaining = b.amount - spent;
      const isExceeded = spent > b.amount;
      const isWarning = !isExceeded && percent >= 80;

      return {
        budget: b,
        category: cat,
        limit: b.amount,
        spent,
        percent,
        remaining,
        isExceeded,
        isWarning,
      };
    });
  }, [activeBudgets, monthExpenses, categoryMap]);

  const totalBudgeted = useMemo(() => activeBudgets.reduce((sum, b) => sum + b.amount, 0), [activeBudgets]);
  const totalSpent = useMemo(() => budgetDetails.reduce((sum, d) => sum + d.spent, 0), [budgetDetails]);
  const remainingBudget = totalBudgeted - totalSpent;
  const overallPercent = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Monthly Budget Planning
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Set spending limits by category and get threshold alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month & Year picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none px-2 py-1 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString(undefined, { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none px-2 py-1 cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            id="create-budget-btn"
            onClick={onOpenNewBudget}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Total Budgeted
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalBudgeted, user.currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Allocated across {activeBudgets.length} categories
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Actual Spent
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight">
            {formatCurrency(totalSpent, user.currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {overallPercent}% of total budgeted consumed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Remaining Buffer
          </div>
          <div className={`text-2xl font-black tracking-tight ${remainingBudget >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(remainingBudget, user.currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {remainingBudget >= 0 ? 'Within allocated limit' : 'Over budget by ' + formatCurrency(Math.abs(remainingBudget), user.currency)}
          </p>
        </div>
      </div>

      {/* Active Budgets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Category Budgets for {formatMonthYear(selectedYear, selectedMonth)}
            </h3>
            <p className="text-xs text-slate-500">Live spend calculation synced with recorded expenses</p>
          </div>
        </div>

        {budgetDetails.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <PieChart className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 mb-3">No budgets configured for this month.</p>
            <button
              onClick={onOpenNewBudget}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Add First Budget Limit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetDetails.map((item) => (
              <div
                key={item.budget.id}
                className={`p-4 rounded-xl border transition ${
                  item.isExceeded
                    ? 'bg-rose-50/40 border-rose-200'
                    : item.isWarning
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      iconName={item.category?.icon || 'Tag'}
                      color={item.category?.color}
                      className="w-4 h-4"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {item.category?.name || 'Category'}
                      </h4>
                      {item.budget.notes && (
                        <p className="text-[11px] text-slate-400">{item.budget.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditBudget(item.budget)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition flex items-center gap-1 cursor-pointer"
                      title="Edit Budget Limit"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBudget(item.budget.id)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition flex items-center gap-1 cursor-pointer"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="flex items-baseline justify-between text-xs mb-1.5 pt-1">
                  <div>
                    <span className="font-extrabold text-base text-slate-900">
                      {formatCurrency(item.spent, user.currency)}
                    </span>
                    <span className="text-slate-500 font-medium"> spent</span>
                  </div>
                  <div className="text-slate-600">
                    Cap: <strong>{formatCurrency(item.limit, user.currency)}</strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      item.isExceeded
                        ? 'bg-rose-600'
                        : item.isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, item.percent)}%` }}
                  />
                </div>

                {/* Status footer */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">
                    {item.percent}% utilized
                  </span>
                  {item.isExceeded ? (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Exceeded by {formatCurrency(Math.abs(item.remaining), user.currency)}
                    </span>
                  ) : item.isWarning ? (
                    <span className="text-amber-800 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formatCurrency(item.remaining, user.currency)} remaining
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {formatCurrency(item.remaining, user.currency)} remaining
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
