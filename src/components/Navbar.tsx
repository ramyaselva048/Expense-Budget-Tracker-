import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  WalletCards, 
  PieChart, 
  Target, 
  BarChart3, 
  FileSpreadsheet, 
  GraduationCap,
  PlusCircle,
  Coins,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Users,
  RotateCcw,
  Database,
  CheckCircle2,
  RefreshCw,
  Server
} from 'lucide-react';
import { ActiveTab, CurrencyCode, User } from '../types';
import { CURRENCY_CONFIGS } from '../utils/formatters';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: User;
  onUpdateCurrency: (currency: CurrencyCode) => void;
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
  onOpenInternshipHub: () => void;
  onLogout: () => void;
  onResetData?: () => void;
  allUsers?: User[];
  onSwitchUser?: (user: User) => void;
  onRefreshData?: () => void;
  counts?: { expenses: number; incomes: number; budgets: number; goals: number };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onUpdateCurrency,
  onOpenNewExpense,
  onOpenNewIncome,
  onOpenInternshipHub,
  onLogout,
  onResetData,
  allUsers = [],
  onSwitchUser,
  onRefreshData,
  counts,
}) => {
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showDbModal, setShowDbModal] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'income', label: 'Income', icon: WalletCards },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const handleManualSync = async () => {
    if (!onRefreshData) return;
    setIsSyncing(true);
    try {
      await onRefreshData();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-sm">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Expense & Budget Tracker
                </span>
                
                {/* TiDB Cloud Live Status Badge */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setShowDbModal(!showDbModal)}
                    title="TiDB Cloud MySQL connected - Click for database details"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 transition cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>TiDB Cloud: Connected</span>
                  </button>

                  {showDbModal && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDbModal(false)} />
                      <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in duration-150 text-left">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-sm text-slate-900">TiDB Cloud MySQL</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Live
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">Host:</span>
                            <p className="font-mono text-slate-700 truncate">gateway01.ap-southeast-1.prod.aws.tidbcloud.com</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-slate-400">Primary DB:</span>
                              <p className="font-mono font-semibold text-emerald-700">expense_tracker</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Replica DB:</span>
                              <p className="font-mono font-semibold text-slate-800">test</p>
                            </div>
                          </div>
                          {counts && (
                            <div className="pt-1">
                              <span className="text-slate-500 font-medium">Saved Records in TiDB:</span>
                              <div className="grid grid-cols-4 gap-1.5 mt-1 text-center">
                                <div className="bg-blue-50 border border-blue-100 rounded p-1">
                                  <div className="font-bold text-blue-700">{counts.expenses}</div>
                                  <div className="text-[10px] text-blue-600">Expenses</div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded p-1">
                                  <div className="font-bold text-emerald-700">{counts.incomes}</div>
                                  <div className="text-[10px] text-emerald-600">Incomes</div>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded p-1">
                                  <div className="font-bold text-amber-700">{counts.budgets}</div>
                                  <div className="text-[10px] text-amber-600">Budgets</div>
                                </div>
                                <div className="bg-purple-50 border border-purple-100 rounded p-1">
                                  <div className="font-bold text-purple-700">{counts.goals}</div>
                                  <div className="text-[10px] text-purple-600">Goals</div>
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500 pt-1">
                            All new expenses, incomes, budgets, and goals are saved immediately into both TiDB Cloud schemas.
                          </p>
                        </div>

                        {onRefreshData && (
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <button
                              onClick={handleManualSync}
                              disabled={isSyncing}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                              <span>{isSyncing ? 'Syncing...' : 'Sync Data from TiDB Cloud'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Personal Finance & Budgeting System
              </p>
            </div>
          </div>

          {/* Action bar: Currency selector & Quick Add & User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency selector */}
            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Currency:</span>
              <select
                value={user.currency}
                onChange={(e) => onUpdateCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                title="Select Currency"
              >
                {Object.values(CURRENCY_CONFIGS).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Add Dropdown */}
            <div className="relative">
              <button
                id="quick-add-btn"
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-sm transition shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {showAddMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAddMenu(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      id="menu-add-expense"
                      onClick={() => {
                        setShowAddMenu(false);
                        onOpenNewExpense();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Record Expense
                    </button>
                    <button
                      id="menu-add-income"
                      onClick={() => {
                        setShowAddMenu(false);
                        onOpenNewIncome();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Add Income
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* User Profile & Logout Menu */}
            <div className="relative flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                id="user-profile-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="Account Menu"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <p className="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                  <p className="text-slate-500 font-mono text-[10px]">@{user.username}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Direct Fast Reset Button */}
              {onResetData && (
                <button
                  id="header-reset-btn"
                  onClick={onResetData}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 text-xs font-semibold transition cursor-pointer"
                  title="Reset application to default clean state"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}

              {/* Direct Fast Logout Button */}
              <button
                id="header-logout-btn"
                onClick={onLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                title="Logout of current session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-300 font-bold text-sm flex items-center justify-center">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 text-sm truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Logged in as @{user.username}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Switch User Demo Accounts */}
                    {allUsers.length > 1 && onSwitchUser && (
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Switch Account</span>
                        </p>
                        <div className="space-y-1">
                          {allUsers.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setShowUserMenu(false);
                                onSwitchUser(u);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                                u.id === user.id
                                  ? 'bg-amber-50 font-bold text-amber-900'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span className="truncate">{u.first_name} {u.last_name}</span>
                              {u.id === user.id ? (
                                <span className="text-[10px] font-mono text-amber-600">Active</span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Switch</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="px-2 pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenInternshipHub();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer"
                      >
                        <GraduationCap className="w-4 h-4 text-amber-600" />
                        <span>Internship Dossier & SQL Dump</span>
                      </button>
                      {onResetData && (
                        <button
                          id="menu-reset-btn"
                          onClick={() => {
                            setShowUserMenu(false);
                            onResetData();
                          }}
                          className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 transition cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                          <span>Reset All Data & Restore Sample</span>
                        </button>
                      )}
                      <button
                        id="menu-logout-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out of Session</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab navigation pills */}
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-2 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
