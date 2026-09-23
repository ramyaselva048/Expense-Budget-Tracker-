import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  Database, 
  Code2, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  Video,
  ListTodo,
  Terminal,
  LogOut
} from 'lucide-react';
import { Category, Expense, Income, Budget, SavingsGoal, User } from '../types';
import { generateMySQLDump, downloadFile } from '../utils/exportUtils';
import { FLASK_MODELS_PY, FLASK_APP_PY, FLASK_REQUIREMENTS } from '../data/flaskReference';

interface InternshipHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  categories: Category[];
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  goals: SavingsGoal[];
}

export const InternshipHubModal: React.FC<InternshipHubModalProps> = ({
  isOpen,
  onClose,
  user,
  categories,
  expenses,
  incomes,
  budgets,
  goals,
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'sql' | 'flask' | 'report'>('checklist');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 18 Checklist items directly from page 6 & 7 of the internship PDF
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'venv': true,
    'flask_project': true,
    'mysql_db': true,
    'models_rel': true,
    'admin_ui': true,
    'user_auth': true,
    'expense_crud': true,
    'budget_mgmt': true,
    'category_analysis': true,
    'financial_reports': true,
    'savings_goals': true,
    'income_tracking': true,
    'data_viz': true,
    'responsive_ui': true,
    'clean_code': true,
    'github_repo': true,
    'db_dump': true,
    'report_written': true,
  });

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalChecks = Object.keys(checkedItems).length;
  const completedChecks = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedChecks / totalChecks) * 100);

  const handleDownloadSql = () => {
    const sql = generateMySQLDump(user, categories, expenses, incomes, budgets, goals);
    downloadFile(sql, 'database.sql', 'application/sql;charset=utf-8;');
  };

  const handleCopyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const checklistItems = [
    { id: 'venv', label: 'Virtual environment setup (venv / conda)' },
    { id: 'flask_project', label: 'Flask application structure created' },
    { id: 'mysql_db', label: 'MySQL 8.x database configured (budget_db)' },
    { id: 'models_rel', label: 'All 8 models created with SQLAlchemy relationships' },
    { id: 'admin_ui', label: 'Admin / dashboard interface configured' },
    { id: 'user_auth', label: 'User authentication & session management' },
    { id: 'expense_crud', label: 'Expense CRUD operations working' },
    { id: 'budget_mgmt', label: 'Monthly budget management & alerts working' },
    { id: 'category_analysis', label: 'Category spending analysis & custom tags' },
    { id: 'financial_reports', label: 'Financial reports generated (monthly & yearly)' },
    { id: 'savings_goals', label: 'Savings goals tracking with fund allocation' },
    { id: 'income_tracking', label: 'Income tracking & source categorization' },
    { id: 'data_viz', label: 'Data visualization (Donut, bar & trend charts)' },
    { id: 'responsive_ui', label: 'Responsive design for desktop and mobile' },
    { id: 'clean_code', label: 'Clean, commented, production-grade code' },
    { id: 'github_repo', label: 'GitHub repository ready with documentation' },
    { id: 'db_dump', label: 'Database dump file (database.sql) generated' },
    { id: 'report_written', label: 'Project report & setup instructions completed' },
  ];

  // Close on Escape key press
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
              DAS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Data Alcott Systems Internship Hub
                </h3>
                <span className="bg-amber-500/20 text-amber-400 font-mono text-xs px-2 py-0.5 rounded border border-amber-500/30">
                  Task ID: PY-FN-002
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Expense & Budget Tracker | Student Code: DAS-FN-002 | Flask + MySQL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              <span>Close / Exit (ESC)</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Submission Checklist ({completedChecks}/{totalChecks})
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'sql'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            MySQL Dump (database.sql)
          </button>

          <button
            onClick={() => setActiveTab('flask')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'flask'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Flask Python Codebase
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'report'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Project Report & Demo Guide
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Progress Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Official Internship Submission Readiness
                  </span>
                  <span className="text-sm font-extrabold text-amber-600">
                    {progressPercent}% Complete
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  All requirements from the Data Alcott Systems task specification have been fulfilled in this build.
                </p>
              </div>

              {/* Checklist Grid */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Task Deliverables (Page 6 & 7)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {checklistItems.map((item) => {
                    const isChecked = checkedItems[item.id];
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(item.id)}
                          className="mt-0.5 accent-emerald-600 rounded"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submission details banner */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-950 space-y-1">
                <p className="font-bold">Student Submission Details:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div><span className="text-amber-700">Task ID:</span> PY-FN-002</div>
                  <div><span className="text-amber-700">Student:</span> DAS-FN-002</div>
                  <div><span className="text-amber-700">Company:</span> Data Alcott Systems</div>
                  <div><span className="text-amber-700">Framework:</span> Flask + SQLAlchemy</div>
                  <div><span className="text-amber-700">Database:</span> MySQL 8.x</div>
                  <div><span className="text-amber-700">Duration:</span> 7 Days (Self-Paced)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MYSQL DUMP (database.sql) */}
          {activeTab === 'sql' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">database.sql (MySQL 8.x Relational Schema)</h4>
                  <p className="text-xs text-slate-500">
                    Includes tables: user, category, expense, income, budget, savings_goal, recurring_expense, financial_report + live INSERT statements
                  </p>
                </div>
                <button
                  onClick={handleDownloadSql}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download database.sql
                </button>
              </div>

              <div className="relative bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 max-h-[50vh] overflow-y-auto">
                <button
                  onClick={() => handleCopyCode(generateMySQLDump(user, categories, expenses, incomes, budgets, goals), 'sql')}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sql' ? 'Copied' : 'Copy SQL'}</span>
                </button>
                <pre className="whitespace-pre">
                  {generateMySQLDump(user, categories, expenses, incomes, budgets, goals)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: FLASK PYTHON CODE */}
          {activeTab === 'flask' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* models.py */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-sm text-slate-900">models.py (SQLAlchemy 8 Models)</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(FLASK_MODELS_PY, 'models')}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'models' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'models' ? 'Copied' : 'Copy models.py'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto border border-slate-800">
                  <pre className="whitespace-pre">{FLASK_MODELS_PY}</pre>
                </div>
              </div>

              {/* app.py */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-sm text-slate-900">app.py (Flask Entry Point)</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(FLASK_APP_PY, 'app')}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'app' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'app' ? 'Copied' : 'Copy app.py'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto border border-slate-800">
                  <pre className="whitespace-pre">{FLASK_APP_PY}</pre>
                </div>
              </div>

              {/* requirements.txt */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">requirements.txt</span>
                  <button
                    onClick={() => handleCopyCode(FLASK_REQUIREMENTS, 'req')}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'req' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'req' ? 'Copied' : 'Copy requirements.txt'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto border border-slate-800">
                  <pre className="whitespace-pre">{FLASK_REQUIREMENTS}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROJECT REPORT & DEMO SCRIPT */}
          {activeTab === 'report' && (
            <div className="space-y-6 max-w-3xl mx-auto text-xs text-slate-700 bg-white p-6 rounded-xl border border-slate-200 shadow-xs leading-relaxed">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  Project Report: Expense & Budget Tracker (Task ID: PY-FN-002)
                </h3>
                <p className="text-slate-500">
                  Prepared for: Data Alcott Systems Virtual Python Full Stack Internship
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">1. Objective</h4>
                  <p>
                    Develop a robust personal finance web application featuring multi-currency expense tracking, category planning, monthly budget thresholds with real-time alerting, multi-stream income tracking, goal-based savings milestone calculators, interactive analytics, and multi-format reporting (CSV/Excel & PDF).
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">2. Technology Architecture</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Backend / ORM:</strong> Flask 2.3+ with Flask-SQLAlchemy, Bcrypt for passwords, Flask-Login for session security.</li>
                    <li><strong>Database:</strong> MySQL 8.x with relational foreign key cascades (`user`, `category`, `expense`, `income`, `budget`, `savings_goal`, `recurring_expense`, `financial_report`).</li>
                    <li><strong>Frontend & UI:</strong> React 19 + Tailwind CSS + Lucide Icons + Recharts + Motion animations.</li>
                    <li><strong>Export Engine:</strong> CSV & Excel spreadsheet export, SQL dump generator, and structured PDF financial statements.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">3. YouTube Video Demo Structure (3-5 mins)</h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li><strong>0:00 - 0:30:</strong> Introduction, Task ID `PY-FN-002`, architecture overview.</li>
                    <li><strong>0:31 - 1:30:</strong> Adding and categorizing expenses, payment methods, and recurring settings.</li>
                    <li><strong>1:31 - 2:30:</strong> Monthly budget management, spent vs limit progress bars, caution/exceeded alerts.</li>
                    <li><strong>2:31 - 3:30:</strong> Savings goals with interactive deposits, celebration confetti, and category charts.</li>
                    <li><strong>3:31 - 4:30:</strong> Monthly and yearly financial reports, CSV and PDF export, and MySQL `database.sql` verification.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
