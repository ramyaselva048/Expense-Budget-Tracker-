import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  Plus, 
  PieChart as PieIcon, 
  BarChart3, 
  Tag, 
  ArrowUpRight, 
  Layers, 
  Palette,
  Edit3,
  Trash2
} from 'lucide-react';
import { Category, Expense, Income, User } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface AnalyticsViewProps {
  user: User;
  categories: Category[];
  expenses: Expense[];
  incomes: Income[];
  onOpenNewCategory: () => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (id: number) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  user,
  categories,
  expenses,
  incomes,
  onOpenNewCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '90days'>('all');

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Filter expenses by time range
  const filteredExpenses = useMemo(() => {
    if (timeRange === 'all') return expenses;
    const now = new Date().getTime();
    const days = timeRange === '30days' ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return expenses.filter(e => new Date(e.date).getTime() >= cutoff);
  }, [expenses, timeRange]);

  const totalExpense = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  // Group by category for Pie Chart
  const categoryData = useMemo(() => {
    const map: Record<number, { amount: number; count: number }> = {};
    filteredExpenses.forEach(e => {
      if (!map[e.category_id]) {
        map[e.category_id] = { amount: 0, count: 0 };
      }
      map[e.category_id].amount += e.amount;
      map[e.category_id].count += 1;
    });

    return Object.entries(map)
      .map(([catId, data]) => {
        const cat = categoryMap.get(Number(catId));
        return {
          id: Number(catId),
          name: cat?.name || 'Other',
          color: cat?.color || '#94A3B8',
          icon: cat?.icon || 'Tag',
          amount: data.amount,
          count: data.count,
          percentage: totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : '0',
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, categoryMap, totalExpense]);

  // Monthly Income vs Expense comparison (last 6 months)
  const monthlyComparisonData = useMemo(() => {
    const monthsMap: Record<string, { monthKey: string; label: string; income: number; expense: number }> = {};

    // Get last 6 calendar months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'short' });
      monthsMap[key] = { monthKey: key, label, income: 0, expense: 0 };
    }

    incomes.forEach(i => {
      const key = i.date.slice(0, 7);
      if (monthsMap[key]) {
        monthsMap[key].income += i.amount;
      }
    });

    expenses.forEach(e => {
      const key = e.date.slice(0, 7);
      if (monthsMap[key]) {
        monthsMap[key].expense += e.amount;
      }
    });

    return Object.values(monthsMap);
  }, [incomes, expenses]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Category Analysis & Visualizations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Visual breakdown of outflows, inflow vs outflow trends, and custom tags
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['all', '90days', '30days'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'all' ? 'All Time' : range === '90days' ? 'Last 90 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewCategory}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Two Chart Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Donut Category Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-600" />
                Category Spending Distribution
              </h3>
              <p className="text-xs text-slate-500">Proportion of total expenses</p>
            </div>
            <span className="text-xs font-black text-rose-600">
              Total: {formatCurrency(totalExpense, user.currency)}
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              No expense data recorded in this period.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value), user.currency), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      color: '#F8FAFC',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#F8FAFC' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Income vs Expense Monthly Trend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Monthly Inflow vs Outflow
              </h3>
              <p className="text-xs text-slate-500">6-month comparison of earnings and spend</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${user.currency === 'USD' ? '$' : ''}${v}`} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value), user.currency),
                    name === 'income' ? 'Total Income' : 'Total Expense',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Category Expenditure Breakdown</h3>
            <p className="text-xs text-slate-500">Detailed metric analysis by spending category</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Transaction Count</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-right">Percentage</th>
                <th className="py-3 px-4">Visual Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <CategoryIcon iconName={item.icon} color={item.color} className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {item.count} transactions
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                    {formatCurrency(item.amount, user.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-600">
                    {item.percentage}%
                  </td>
                  <td className="py-3 px-4 w-44">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Categories Grid & Creation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Configured Categories</h3>
            <p className="text-xs text-slate-500">Icons, color badges, and account mapping</p>
          </div>
          <button
            onClick={onOpenNewCategory}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tag</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2 group hover:border-slate-200 transition"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <CategoryIcon iconName={cat.icon} color={cat.color} className="w-4 h-4 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">{cat.name}</p>
                  <span className={`text-[10px] font-semibold uppercase ${cat.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {cat.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                {onEditCategory && (
                  <button
                    type="button"
                    onClick={() => onEditCategory(cat)}
                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                    title={`Edit ${cat.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteCategory && (
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                    title={`Delete ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
