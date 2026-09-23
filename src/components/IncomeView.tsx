import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  WalletCards, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Repeat, 
  Calendar 
} from 'lucide-react';
import { Income, User } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface IncomeViewProps {
  user: User;
  incomes: Income[];
  onOpenNewIncome: () => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (id: number) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  user,
  incomes,
  onOpenNewIncome,
  onEditIncome,
  onDeleteIncome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'recurring' | 'onetime'>('all');

  const filteredIncomes = useMemo(() => {
    return incomes.filter((inc) => {
      const matchesSearch = 
        inc.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.notes && inc.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPeriod =
        selectedPeriod === 'all' ||
        (selectedPeriod === 'recurring' && inc.is_recurring) ||
        (selectedPeriod === 'onetime' && !inc.is_recurring);

      return matchesSearch && matchesPeriod;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes, searchTerm, selectedPeriod]);

  const totalIncome = useMemo(
    () => filteredIncomes.reduce((sum, i) => sum + i.amount, 0),
    [filteredIncomes]
  );

  const recurringTotal = useMemo(
    () => filteredIncomes.filter(i => i.is_recurring).reduce((sum, i) => sum + i.amount, 0),
    [filteredIncomes]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Income Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Monitor incoming cashflow, salary, client retainers, and dividends
          </p>
        </div>
        <button
          id="add-income-btn"
          onClick={onOpenNewIncome}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Inflow
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatCurrency(totalIncome, user.currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{filteredIncomes.length} recorded inflows</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recurring / Salary
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 tracking-tight">
            {formatCurrency(recurringTotal, user.currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Predictable baseline inflow</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Variable / Freelance
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            {formatCurrency(Math.max(0, totalIncome - recurringTotal), user.currency)}
          </div>
          <p className="text-xs text-slate-500 mt-1">One-off bonuses and gig payouts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search income source, client, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 outline-none text-slate-900"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'recurring', 'onetime'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer capitalize ${
                  selectedPeriod === period
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {period === 'all' ? 'All Sources' : period === 'recurring' ? 'Recurring' : 'One-time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incomes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredIncomes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <p className="mb-2">No income entries found.</p>
            <button
              onClick={onOpenNewIncome}
              className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs cursor-pointer"
            >
              Add First Income
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Income Source / Client</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount ({user.currency})</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredIncomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>
                        <span>{inc.source}</span>
                        {inc.notes && (
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                            {inc.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {inc.is_recurring ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <Repeat className="w-2.5 h-2.5" />
                          {inc.recurrence_period || 'Monthly'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          One-time
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {formatDate(inc.date)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                      +{formatCurrency(inc.amount, user.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditIncome(inc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteIncome(inc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
