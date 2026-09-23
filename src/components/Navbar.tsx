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
  RotateCcw
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
}) => {
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'income', label: 'Income', icon: WalletCards },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

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
                <span className="hidden md:inline-block text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Flask + MySQL
                </span>
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
