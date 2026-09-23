/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Category, 
  Expense, 
  Income, 
  Budget, 
  SavingsGoal, 
  ActiveTab, 
  CurrencyCode 
} from './types';
import { 
  INITIAL_USER, 
  INITIAL_USERS,
  INITIAL_CATEGORIES, 
  INITIAL_EXPENSES, 
  INITIAL_INCOMES, 
  INITIAL_BUDGETS, 
  INITIAL_GOALS 
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { IncomeView } from './components/IncomeView';
import { BudgetsView } from './components/BudgetsView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { GoalModal } from './components/GoalModal';
import { GoalFundsModal } from './components/GoalFundsModal';
import { CategoryModal } from './components/CategoryModal';
import { InternshipHubModal } from './components/InternshipHubModal';
import { CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { api } from './services/api';
import { 
  isDuplicateExpense, 
  isDuplicateIncome, 
  isDuplicateCategory, 
  isDuplicateBudget, 
  sanitizeInput, 
  generateSecureId 
} from './utils/security';

const STORAGE_KEYS = {
  USER: 'ebt_user_v3',
  USERS: 'ebt_users_v3',
  AUTH: 'ebt_is_authenticated_v3',
  CATEGORIES: 'ebt_categories_v3',
  EXPENSES: 'ebt_expenses_v3',
  INCOMES: 'ebt_incomes_v3',
  BUDGETS: 'ebt_budgets_v3',
  GOALS: 'ebt_goals_v3',
};

export default function App() {
  // Authentication & Users State
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        // Strip legacy mock users to ensure production integrity
        const cleaned = parsed.filter(u => u.username !== 'alexdev' && u.username !== 'priyasharma');
        return cleaned.length > 0 ? cleaned : INITIAL_USERS;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Always display Sign In / Sign Up portal when website is opened
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Load state from localStorage or defaults
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCOMES);
      return saved ? JSON.parse(saved) : INITIAL_INCOMES;
    } catch {
      return INITIAL_INCOMES;
    }
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<'expense' | 'income'>('expense');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [isGoalFundsModalOpen, setIsGoalFundsModalOpen] = useState(false);
  const [selectedFundsGoal, setSelectedFundsGoal] = useState<SavingsGoal | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isInternshipHubOpen, setIsInternshipHubOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.AUTH, isAuthenticated ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [user, users, isAuthenticated, categories, expenses, incomes, budgets, goals]);

  // Auth Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedInUser));
    showToast(`Welcome back, ${loggedInUser.first_name}!`);
  };

  const handleRegister = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    showToast(`Account created! Welcome, ${newUser.first_name}!`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
    showToast('Logged out of session', 'info');
  };

  const handleSwitchUser = (switchedUser: User) => {
    setUser(switchedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(switchedUser));
    showToast(`Switched account to ${switchedUser.first_name} ${switchedUser.last_name}`);
  };

  // Password Update Handler
  const handleUpdateUserPassword = (email: string, newPasswordHash: string): boolean => {
    setUsers(prev =>
      prev.map(u => (u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPasswordHash } : u))
    );
    if (user.email.toLowerCase() === email.toLowerCase()) {
      setUser(prev => ({ ...prev, password: newPasswordHash }));
    }
    showToast('Password credentials securely updated');
    return true;
  };

  // Handler: Update Currency
  const handleUpdateCurrency = (currency: CurrencyCode) => {
    setUser(prev => ({ ...prev, currency }));
    showToast(`Currency updated to ${currency}`);
  };

  // Handler: Save Expense
  const handleSaveExpense = (
    expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>,
    id?: number
  ) => {
    const timestamp = new Date().toISOString();
    const sanitizedDesc = sanitizeInput(expenseData.description);
    const sanitizedNotes = expenseData.notes ? sanitizeInput(expenseData.notes) : undefined;
    const cleanData = { ...expenseData, description: sanitizedDesc, notes: sanitizedNotes };

    if (isDuplicateExpense(cleanData, expenses, id)) {
      showToast('Notice: A matching expense entry already exists on this date', 'info');
    }

    if (id) {
      setExpenses(prev =>
        prev.map(e =>
          e.id === id ? { ...e, ...cleanData, updated_at: timestamp } : e
        )
      );
      showToast('Expense updated successfully');
    } else {
      const nextId = generateSecureId();
      const newExpense: Expense = {
        ...cleanData,
        id: nextId,
        created_at: timestamp,
        updated_at: timestamp,
      };
      setExpenses(prev => [newExpense, ...prev]);
      showToast('Expense recorded successfully');
    }
  };

  // Handler: Delete Expense
  const handleDeleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Expense removed', 'info');
  };

  // Handler: Save Income
  const handleSaveIncome = (
    incomeData: Omit<Income, 'id' | 'created_at' | 'updated_at'>,
    id?: number
  ) => {
    const timestamp = new Date().toISOString();
    const sanitizedSource = sanitizeInput(incomeData.source);
    const sanitizedNotes = incomeData.notes ? sanitizeInput(incomeData.notes) : undefined;
    const cleanData = { ...incomeData, source: sanitizedSource, notes: sanitizedNotes };

    if (isDuplicateIncome(cleanData, incomes, id)) {
      showToast('Notice: A matching income entry already exists on this date', 'info');
    }

    if (id) {
      setIncomes(prev =>
        prev.map(i =>
          i.id === id ? { ...i, ...cleanData, updated_at: timestamp } : i
        )
      );
      showToast('Income updated successfully');
    } else {
      const nextId = generateSecureId();
      const newIncome: Income = {
        ...cleanData,
        id: nextId,
        created_at: timestamp,
        updated_at: timestamp,
      };
      setIncomes(prev => [newIncome, ...prev]);
      showToast('Income logged successfully');
    }
  };

  // Handler: Delete Income
  const handleDeleteIncome = (id: number) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    showToast('Income removed', 'info');
  };

  // Handler: Save Budget
  const handleSaveBudget = (
    budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>,
    id?: number
  ) => {
    const timestamp = new Date().toISOString();
    const sanitizedNotes = budgetData.notes ? sanitizeInput(budgetData.notes) : undefined;
    const cleanData = { ...budgetData, notes: sanitizedNotes };

    // Prevent duplicate budgets for the same category in the same month & year: update existing
    const existingMatch = budgets.find(
      b => b.id !== id && b.category_id === cleanData.category_id && b.month === cleanData.month && b.year === cleanData.year
    );

    if (existingMatch) {
      setBudgets(prev =>
        prev.map(b => (b.id === existingMatch.id ? { ...b, ...cleanData, updated_at: timestamp } : b))
      );
      showToast(`Updated existing monthly budget for this category`);
      return;
    }

    if (id) {
      setBudgets(prev =>
        prev.map(b => (b.id === id ? { ...b, ...cleanData, updated_at: timestamp } : b))
      );
      showToast('Budget updated');
    } else {
      const nextId = generateSecureId();
      const newBudget: Budget = {
        ...cleanData,
        id: nextId,
        created_at: timestamp,
        updated_at: timestamp,
      };
      setBudgets(prev => [...prev, newBudget]);
      showToast('Budget limit set');
    }
  };

  // Handler: Delete Budget
  const handleDeleteBudget = (id: number) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    showToast('Budget deleted', 'info');
  };

  // Handler: Save Goal
  const handleSaveGoal = (
    goalData: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>,
    id?: number
  ) => {
    const timestamp = new Date().toISOString();
    const sanitizedName = sanitizeInput(goalData.name);
    const sanitizedNotes = goalData.notes ? sanitizeInput(goalData.notes) : undefined;
    const cleanData = { ...goalData, name: sanitizedName, notes: sanitizedNotes };

    if (id) {
      setGoals(prev =>
        prev.map(g => (g.id === id ? { ...g, ...cleanData, updated_at: timestamp } : g))
      );
      showToast('Goal updated');
    } else {
      const nextId = generateSecureId();
      const newGoal: SavingsGoal = {
        ...cleanData,
        id: nextId,
        created_at: timestamp,
        updated_at: timestamp,
      };
      setGoals(prev => [...prev, newGoal]);
      showToast('Savings goal created');
    }
  };

  // Handler: Delete Goal
  const handleDeleteGoal = (id: number) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    showToast('Goal deleted', 'info');
  };

  // Handler: Update Goal Funds
  const handleUpdateGoalAmount = (
    goalId: number,
    newSavedAmount: number,
    isCompleted: boolean
  ) => {
    const timestamp = new Date().toISOString();
    setGoals(prev =>
      prev.map(g =>
        g.id === goalId
          ? {
              ...g,
              saved_amount: newSavedAmount,
              is_completed: isCompleted,
              updated_at: timestamp,
            }
          : g
      )
    );
    showToast(isCompleted ? 'Target achieved! Congratulations!' : 'Funds adjusted successfully');
  };

  // Handler: Add Custom Category
  const handleAddCategory = (catData: Omit<Category, 'id' | 'created_at'>) => {
    const sanitizedName = sanitizeInput(catData.name);
    if (!sanitizedName) {
      showToast('Category name cannot be blank', 'info');
      return;
    }
    if (isDuplicateCategory(sanitizedName, catData.type, categories)) {
      showToast(`A category named "${sanitizedName}" already exists`, 'info');
      return;
    }
    const nextId = generateSecureId();
    const newCat: Category = {
      ...catData,
      name: sanitizedName,
      id: nextId,
      created_at: new Date().toISOString(),
    };
    setCategories(prev => [...prev, newCat]);
    showToast(`Category "${sanitizedName}" created`);
  };

  // Reset to clean default sample dataset (instant & safe)
  const handleResetData = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    setUser(INITIAL_USER);
    setUsers(INITIAL_USERS);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    setIsInternshipHubOpen(false);
    setIsTxModalOpen(false);
    setIsBudgetModalOpen(false);
    setIsGoalModalOpen(false);
    setIsGoalFundsModalOpen(false);
    setIsCategoryModalOpen(false);
    setCategories(INITIAL_CATEGORIES);
    setExpenses(INITIAL_EXPENSES);
    setIncomes(INITIAL_INCOMES);
    setBudgets(INITIAL_BUDGETS);
    setGoals(INITIAL_GOALS);
    showToast('Reset completed! Production data restored.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
        <AuthView
          users={users}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onUpdateUserPassword={handleUpdateUserPassword}
          defaultEmail=""
        />

        <InternshipHubModal
          isOpen={isInternshipHubOpen}
          onClose={() => setIsInternshipHubOpen(false)}
          user={user}
          categories={categories}
          expenses={expenses}
          incomes={incomes}
          budgets={budgets}
          goals={goals}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white bg-slate-900 border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onUpdateCurrency={handleUpdateCurrency}
        onOpenNewExpense={() => {
          setEditingExpense(null);
          setTxModalType('expense');
          setIsTxModalOpen(true);
        }}
        onOpenNewIncome={() => {
          setEditingIncome(null);
          setTxModalType('income');
          setIsTxModalOpen(true);
        }}
        onOpenInternshipHub={() => setIsInternshipHubOpen(true)}
        onLogout={handleLogout}
        onResetData={handleResetData}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            categories={categories}
            expenses={expenses}
            incomes={incomes}
            budgets={budgets}
            goals={goals}
            onOpenNewExpense={() => {
              setEditingExpense(null);
              setTxModalType('expense');
              setIsTxModalOpen(true);
            }}
            onOpenNewIncome={() => {
              setEditingIncome(null);
              setTxModalType('income');
              setIsTxModalOpen(true);
            }}
            onOpenNewBudget={() => {
              setEditingBudget(null);
              setIsBudgetModalOpen(true);
            }}
            onOpenGoalFunds={(goal) => {
              setSelectedFundsGoal(goal);
              setIsGoalFundsModalOpen(true);
            }}
            onSelectTab={setActiveTab}
            onDeleteExpense={handleDeleteExpense}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setEditingIncome(null);
              setTxModalType('expense');
              setIsTxModalOpen(true);
            }}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            user={user}
            expenses={expenses}
            categories={categories}
            onOpenNewExpense={() => {
              setEditingExpense(null);
              setTxModalType('expense');
              setIsTxModalOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setEditingIncome(null);
              setTxModalType('expense');
              setIsTxModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'income' && (
          <IncomeView
            user={user}
            incomes={incomes}
            onOpenNewIncome={() => {
              setEditingIncome(null);
              setTxModalType('income');
              setIsTxModalOpen(true);
            }}
            onEditIncome={(inc) => {
              setEditingIncome(inc);
              setEditingExpense(null);
              setTxModalType('income');
              setIsTxModalOpen(true);
            }}
            onDeleteIncome={handleDeleteIncome}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            user={user}
            budgets={budgets}
            categories={categories}
            expenses={expenses}
            onOpenNewBudget={() => {
              setEditingBudget(null);
              setIsBudgetModalOpen(true);
            }}
            onEditBudget={(b) => {
              setEditingBudget(b);
              setIsBudgetModalOpen(true);
            }}
            onDeleteBudget={handleDeleteBudget}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsGoalsView
            user={user}
            goals={goals}
            onOpenNewGoal={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            onEditGoal={(g) => {
              setEditingGoal(g);
              setIsGoalModalOpen(true);
            }}
            onDeleteGoal={handleDeleteGoal}
            onOpenGoalFunds={(g) => {
              setSelectedFundsGoal(g);
              setIsGoalFundsModalOpen(true);
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            user={user}
            categories={categories}
            expenses={expenses}
            incomes={incomes}
            onOpenNewCategory={() => setIsCategoryModalOpen(true)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            user={user}
            categories={categories}
            expenses={expenses}
            incomes={incomes}
            budgets={budgets}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-4 text-xs text-slate-500 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Expense & Budget Tracker</span>
            <span>•</span>
            <span>Personal Finance & Budgeting System</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Reset Sample Data
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingExpense(null);
          setEditingIncome(null);
        }}
        type={txModalType}
        categories={categories}
        user={user}
        onSaveExpense={handleSaveExpense}
        onSaveIncome={handleSaveIncome}
        initialExpense={editingExpense}
        initialIncome={editingIncome}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setEditingBudget(null);
        }}
        categories={categories}
        user={user}
        onSaveBudget={handleSaveBudget}
        initialBudget={editingBudget}
        currentMonth={new Date().getMonth() + 1}
        currentYear={new Date().getFullYear()}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        user={user}
        onSaveGoal={handleSaveGoal}
        initialGoal={editingGoal}
      />

      <GoalFundsModal
        isOpen={isGoalFundsModalOpen}
        onClose={() => {
          setIsGoalFundsModalOpen(false);
          setSelectedFundsGoal(null);
        }}
        goal={selectedFundsGoal}
        user={user}
        onUpdateGoalAmount={handleUpdateGoalAmount}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />

      <InternshipHubModal
        isOpen={isInternshipHubOpen}
        onClose={() => setIsInternshipHubOpen(false)}
        user={user}
        categories={categories}
        expenses={expenses}
        incomes={incomes}
        budgets={budgets}
        goals={goals}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white bg-slate-900 border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
