import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Receipt, 
  Clock, 
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';
import { Budget, Category, Expense, Income, SavingsGoal, User } from '../types';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  user: User;
  categories: Category[];
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  goals: SavingsGoal[];
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
  onOpenNewBudget: () => void;
  onOpenGoalFunds: (goal: SavingsGoal) => void;
  onSelectTab: (tab: any) => void;
  onDeleteExpense: (id: number) => void;
  onEditExpense: (expense: Expense) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  categories,
  expenses,
  incomes,
  budgets,
  goals,
  onOpenNewExpense,
  onOpenNewIncome,
  onOpenNewBudget,
  onOpenGoalFunds,
  onSelectTab,
  onDeleteExpense,
  onEditExpense,
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Filter for current month
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date + (e.date.includes('T') ? '' : 'T00:00:00'));
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
  });

  const currentMonthIncomes = incomes.filter((i) => {
    const d = new Date(i.date + (i.date.includes('T') ? '' : 'T00:00:00'));
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
  });

  const totalExpense = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = currentMonthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Category mapping
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Calculate budget spending
  const currentBudgets = budgets.filter((b) => b.month === currentMonth && b.year === currentYear);
  const budgetStatusList = currentBudgets.map((b) => {
    const cat = categoryMap.get(b.category_id);
    const spent = currentMonthExpenses
      .filter((e) => e.category_id === b.category_id)
      .reduce((acc, e) => acc + e.amount, 0);
    const percent = Math.round((spent / b.amount) * 100);
    const isExceeded = spent > b.amount;
    const isWarning = !isExceeded && percent >= 80;

    return {
      budget: b,
      category: cat,
      spent,
      limit: b.amount,
      percent,
      isExceeded,
      isWarning,
    };
  });

  // Recent 6 transactions combined
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Top expense categories this month
  const categorySpendMap: Record<number, number> = {};
  currentMonthExpenses.forEach((e) => {
    categorySpendMap[e.category_id] = (categorySpendMap[e.category_id] || 0) + e.amount;
  });

  const topCategories = Object.entries(categorySpendMap)
    .map(([catId, amount]) => ({
      category: categoryMap.get(Number(catId)),
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .filter((item) => item.category)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with greeting and month indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Overview for {formatMonthYear(currentYear, currentMonth)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewExpense}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={onOpenNewIncome}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Net Balance
            </span>
            <div className={`p-2 rounded-xl ${netSavings >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            {formatCurrency(netSavings, user.currency)}
          </div>
          <p className="text-xs text-slate-500">
            {netSavings >= 0 ? 'Surplus cashflow this month' : 'Deficit this month'}
          </p>
        </div>

        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Monthly Income
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight mb-1">
            {formatCurrency(totalIncome, user.currency)}
          </div>
          <p className="text-xs text-slate-500">
            {currentMonthIncomes.length} inflow entries recorded
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Monthly Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight mb-1">
            {formatCurrency(totalExpense, user.currency)}
          </div>
          <p className="text-xs text-slate-500">
            {currentMonthExpenses.length} spending transactions
          </p>
        </div>

        {/* Savings Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Savings Rate
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight mb-1">
            {savingsRate}%
          </div>
          <p className="text-xs text-slate-500">
            Target benchmark: &gt;20% of income
          </p>
        </div>
      </div>

      {/* Two Column Layout: Budget Alerts & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Budgets Watcher (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Monthly Budgets Overview</h3>
              <p className="text-xs text-slate-500">Spent vs limit tracking for {formatMonthYear(currentYear, currentMonth)}</p>
            </div>
            <button
              onClick={() => onSelectTab('budgets')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {budgetStatusList.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-xs text-slate-500 mb-2">No budgets defined for this month yet</p>
              <button
                onClick={onOpenNewBudget}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Set Category Budget
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {budgetStatusList.map((item) => (
                <div key={item.budget.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        iconName={item.category?.icon || 'Tag'}
                        color={item.category?.color}
                        className="w-4 h-4"
                      />
                      <span className="font-bold text-slate-800 text-sm">
                        {item.category?.name || 'Category'}
                      </span>
                      {item.isExceeded && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Exceeded!
                        </span>
                      )}
                      {item.isWarning && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {item.percent}% Used
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(item.spent, user.currency)}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {' '}/ {formatCurrency(item.limit, user.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Spending Categories (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Top Categories</h3>
              <button
                onClick={() => onSelectTab('analytics')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No expenses recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {topCategories.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        iconName={item.category?.icon || 'Tag'}
                        color={item.category?.color}
                        className="w-3.5 h-3.5"
                      />
                      <span className="font-semibold text-slate-800">{item.category?.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(item.amount, user.currency)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {item.percentage}% of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 bg-amber-50/50 p-3 rounded-xl border border-amber-100/60">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Budget Tip</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Review recurring subscriptions and dining expenses periodically to maintain a healthy savings buffer.
            </p>
          </div>
        </div>
      </div>

      {/* Savings Goals Grid Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Savings Goals</h3>
            <p className="text-xs text-slate-500">Track and fund your milestones</p>
          </div>
          <button
            onClick={() => onSelectTab('goals')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <span>All Goals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {goals.slice(0, 4).map((goal) => {
            const percent = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
            return (
              <div
                key={goal.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-amber-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm truncate" title={goal.name}>
                      {goal.name}
                    </span>
                    {goal.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[11px] font-bold text-amber-600">{percent}%</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {formatCurrency(goal.saved_amount, user.currency)} / {formatCurrency(goal.target_amount, user.currency)}
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full ${goal.is_completed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onOpenGoalFunds(goal)}
                  className="w-full py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  Manage Funds
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest expenses and purchases</p>
          </div>
          <button
            onClick={() => onSelectTab('expenses')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Expenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No transactions logged yet. Click "+ Add Expense" to start tracking.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExpenses.map((exp) => {
              const cat = categoryMap.get(exp.category_id);
              return (
                <div
                  key={exp.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon
                      iconName={cat?.icon || 'Tag'}
                      color={cat?.color}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{exp.description}</span>
                        {exp.is_recurring && (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {cat?.name || 'Category'} • {formatDate(exp.date)} • {exp.payment_method}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-rose-600">
                      -{formatCurrency(exp.amount, user.currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditExpense(exp)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition flex items-center gap-1 cursor-pointer"
                      title="Edit expense"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp.id)}
                      className="px-2 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition flex items-center gap-1 cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
