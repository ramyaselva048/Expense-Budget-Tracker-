import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  CreditCard, 
  Calendar, 
  Repeat, 
  Tag, 
  ArrowUpDown 
} from 'lucide-react';
import { Category, Expense, PaymentMethod, User } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportExpensesToCSV } from '../utils/exportUtils';
import { CategoryIcon } from './CategoryIcon';

interface ExpensesViewProps {
  user: User;
  expenses: Expense[];
  categories: Category[];
  onOpenNewExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  user,
  expenses,
  categories,
  onOpenNewExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // format: "YYYY-MM" or "all"
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Extract available months from expenses
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(e => {
      if (e.date) {
        months.add(e.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  // Filter and sort
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesSearch = 
          exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCat = 
          selectedCategory === 'all' || exp.category_id === Number(selectedCategory);

        const matchesMethod = 
          selectedMethod === 'all' || exp.payment_method === selectedMethod;

        const matchesMonth = 
          selectedMonth === 'all' || (exp.date && exp.date.startsWith(selectedMonth));

        return matchesSearch && matchesCat && matchesMethod && matchesMonth;
      })
      .sort((a, b) => {
        if (sortField === 'amount') {
          return sortAsc ? a.amount - b.amount : b.amount - a.amount;
        }
        return sortAsc 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [expenses, searchTerm, selectedCategory, selectedMethod, selectedMonth, sortField, sortAsc]);

  const totalFilteredAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Expense Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage, categorize, and monitor all your outgoing expenditures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportExpensesToCSV(filteredExpenses, categories, user)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Export filtered expenses to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            id="add-expense-btn"
            onClick={onOpenNewExpense}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-slate-900"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-800 font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c.type === 'expense').map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-800 font-medium cursor-pointer"
          >
            <option value="all">All Payment Methods</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="PayPal">PayPal</option>
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-800 font-medium cursor-pointer"
          >
            <option value="all">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {new Date(m + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Summary Stats */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredExpenses.length}</strong> of{' '}
            <strong className="text-slate-800">{expenses.length}</strong> expenses
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (sortField === 'date') setSortAsc(!sortAsc);
                else { setSortField('date'); setSortAsc(false); }
              }}
              className="flex items-center gap-1 font-semibold text-slate-700 hover:text-amber-600 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort by Date {sortField === 'date' ? (sortAsc ? '↑' : '↓') : ''}</span>
            </button>
            <div className="text-slate-900 font-bold">
              Total Filtered: <span className="text-rose-600 text-sm font-black">{formatCurrency(totalFilteredAmount, user.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <p className="mb-2">No expenses match the current criteria.</p>
            <button
              onClick={onOpenNewExpense}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-xs cursor-pointer"
            >
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction / Payee</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount ({user.currency})</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExpenses.map((exp) => {
                  const cat = categoryMap.get(exp.category_id);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{exp.description}</span>
                          {exp.is_recurring && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Repeat className="w-2.5 h-2.5" />
                              {exp.recurrence_period || 'Recurring'}
                            </span>
                          )}
                        </div>
                        {exp.notes && (
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5 truncate max-w-xs">
                            {exp.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <CategoryIcon
                            iconName={cat?.icon || 'Tag'}
                            color={cat?.color}
                            className="w-3.5 h-3.5"
                          />
                          <span className="font-medium text-slate-700">{cat?.name || 'Uncategorized'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {exp.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm whitespace-nowrap">
                        -{formatCurrency(exp.amount, user.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditExpense(exp)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition flex items-center gap-1 cursor-pointer"
                            title="Edit expense"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(exp.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition flex items-center gap-1 cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
