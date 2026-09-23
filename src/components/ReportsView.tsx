import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight,
  Receipt,
  FileCheck,
  FileDown,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Budget, Category, Expense, Income, User } from '../types';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/formatters';
import { exportFinancialSummaryToCSV, exportFinancialReportToPDF } from '../utils/exportUtils';
import { CategoryIcon } from './CategoryIcon';

interface ReportsViewProps {
  user: User;
  categories: Category[];
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  user,
  categories,
  expenses,
  incomes,
  budgets,
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Filter expenses based on report type & period
  const periodExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date + (e.date.includes('T') ? '' : 'T00:00:00'));
      if (reportType === 'monthly') {
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      }
      return d.getFullYear() === selectedYear;
    });
  }, [expenses, reportType, selectedMonth, selectedYear]);

  // Filter incomes based on report type & period
  const periodIncomes = useMemo(() => {
    return incomes.filter(i => {
      const d = new Date(i.date + (i.date.includes('T') ? '' : 'T00:00:00'));
      if (reportType === 'monthly') {
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      }
      return d.getFullYear() === selectedYear;
    });
  }, [incomes, reportType, selectedMonth, selectedYear]);

  const totalIncome = useMemo(() => periodIncomes.reduce((sum, i) => sum + i.amount, 0), [periodIncomes]);
  const totalExpense = useMemo(() => periodExpenses.reduce((sum, e) => sum + e.amount, 0), [periodExpenses]);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<number, number> = {};
    periodExpenses.forEach(e => {
      map[e.category_id] = (map[e.category_id] || 0) + e.amount;
    });

    return Object.entries(map).map(([catId, amount]) => {
      const cat = categoryMap.get(Number(catId));
      return {
        id: Number(catId),
        name: cat?.name || 'Uncategorized',
        color: cat?.color || '#94A3B8',
        icon: cat?.icon || 'Tag',
        amount,
        percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0',
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, categoryMap, totalExpense]);

  const handleExportCSV = () => {
    exportFinancialSummaryToCSV(
      user,
      selectedMonth,
      selectedYear,
      periodIncomes,
      periodExpenses,
      budgets,
      categories
    );
    setToastMessage('CSV Spreadsheet exported successfully!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadPDF = () => {
    try {
      setDownloadingPdf(true);
      exportFinancialReportToPDF(
        user,
        reportType,
        selectedMonth,
        selectedYear,
        periodIncomes,
        periodExpenses,
        budgets,
        categories
      );
      setToastMessage('Official Financial Report PDF generated & downloaded successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('PDF generation error:', err);
      try {
        window.print();
      } catch (e) {
        // ignore
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      // In sandbox/iframe environment if window.print is restricted, fallback directly to PDF export
      handleDownloadPDF();
    }
  };

  const handleResetFilters = () => {
    setReportType('monthly');
    setSelectedMonth(today.getMonth() + 1);
    setSelectedYear(today.getFullYear());
    setToastMessage('Report filters reset to current month!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial Reports & Statements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Generate monthly / yearly audits, category breakdowns, and export to Excel or PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switch */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                reportType === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                reportType === 'yearly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Month picker (if monthly) */}
          {reportType === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-xs sm:text-sm font-bold bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-800 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString(undefined, { month: 'short' })}
                </option>
              ))}
            </select>
          )}

          {/* Year picker */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs sm:text-sm font-bold bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-800 cursor-pointer"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Reset Filters button */}
          <button
            id="btn-reset-report-filters"
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 text-xs font-semibold rounded-xl flex items-center gap-1 transition cursor-pointer border border-slate-200"
            title="Reset period to current month"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Export CSV button */}
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            title="Download Excel / CSV spreadsheet"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV</span>
          </button>

          {/* PDF Download button */}
          <button
            id="btn-download-pdf"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Generate and download official PDF report"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <FileDown className="w-4 h-4 text-amber-400" />
            )}
            <span>{downloadingPdf ? 'Generating PDF...' : 'Print / PDF'}</span>
          </button>

          {/* Print button */}
          <button
            id="btn-print-statement"
            onClick={handlePrint}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1 transition cursor-pointer border border-slate-200"
            title="Print statement via browser"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Official Formatted Financial Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Statement Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                PERSONAL FINANCIAL STATEMENT
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded uppercase">
                {reportType} Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Statement Period:{' '}
              <strong className="text-slate-800">
                {reportType === 'monthly'
                  ? formatMonthYear(selectedYear, selectedMonth)
                  : `Fiscal Year ${selectedYear}`}
              </strong>
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600">
            <p className="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
            <p>{user.email}</p>
            <p className="text-slate-400 font-mono text-[11px]">Currency: {user.currency}</p>
          </div>
        </div>

        {/* Financial KPI Summary Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Inflow
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              {formatCurrency(totalIncome, user.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{periodIncomes.length} inflow items</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Outflow
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
              {formatCurrency(totalExpense, user.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{periodExpenses.length} transactions</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Net Surplus / Savings
            </span>
            <div className={`text-xl sm:text-2xl font-black mt-1 ${netSavings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(netSavings, user.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{netSavings >= 0 ? 'Surplus' : 'Deficit'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Savings Rate
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              {savingsRate}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Retained of gross income</p>
          </div>
        </div>

        {/* Category Breakdown Section */}
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm mb-3">
            Expenditure by Category
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Amount ({user.currency})</th>
                  <th className="py-2.5 px-4 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryBreakdown.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(item.amount, user.currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600 font-medium">
                      {item.percentage}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                  <td className="py-2.5 px-4 text-slate-900 font-extrabold">Total Expenses</td>
                  <td className="py-2.5 px-4 text-right text-rose-700 font-black text-sm">
                    {formatCurrency(totalExpense, user.currency)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-900">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Significant Transactions */}
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm mb-3">
            Top Significant Expenses in Period
          </h4>
          <div className="space-y-2">
            {[...periodExpenses]
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
              .map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{exp.description}</span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      {formatDate(exp.date)} • {exp.payment_method}
                    </span>
                  </div>
                  <span className="font-black text-rose-600">
                    -{formatCurrency(exp.amount, user.currency)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Footer Audit Signoff */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Generated via Expense & Budget Tracker • Task ID PY-FN-002</span>
          <span>Timestamp: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold text-white bg-slate-900 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
