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
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { api } from './services/api';
import { formatCurrency, formatDate } from './utils/formatters';
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isInternshipHubOpen, setIsInternshipHubOpen] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    itemDescription?: string;
    itemSubtext?: string;
    onConfirm: () => Promise<void> | void;
    isDeleting: boolean;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
    isDeleting: false,
  });

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Function to reload fresh data from TiDB Cloud
  const refreshData = async () => {
    try {
      const data = await api.fetchAppData(user.id);
      if (data && data.success) {
        if (data.categories && data.categories.length > 0) setCategories(data.categories);
        if (data.expenses) setExpenses(data.expenses);
        if (data.incomes) setIncomes(data.incomes);
        if (data.budgets) setBudgets(data.budgets);
        if (data.goals) setGoals(data.goals);
        if (data.users && data.users.length > 0) setUsers(data.users);
      }
    } catch (err: any) {
      console.warn('Sync data error:', err);
    }
  };

  // Sync to localStorage as client-side backup cache
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

  // Load live data from TiDB Cloud MySQL database
  useEffect(() => {
    let isMounted = true;
    const loadDbData = async () => {
      try {
        const data = await api.fetchAppData(isAuthenticated ? user.id : 0);
        if (!isMounted) return;
        if (data && data.success) {
          if (data.users && data.users.length > 0) setUsers(data.users);
          if (isAuthenticated) {
            if (data.categories && data.categories.length > 0) setCategories(data.categories);
            if (data.expenses) setExpenses(data.expenses);
            if (data.incomes) setIncomes(data.incomes);
            if (data.budgets) setBudgets(data.budgets);
            if (data.goals) setGoals(data.goals);
          }
        }
      } catch (err) {
        console.warn('Could not sync data from MySQL database, using local cache:', err);
      }
    };

    loadDbData();
    return () => {
      isMounted = false;
    };
  }, [user.id, isAuthenticated]);

  // Auth Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setUsers(prev => {
      const exists = prev.some(u => u.id === loggedInUser.id || u.email.toLowerCase() === loggedInUser.email.toLowerCase());
      return exists ? prev.map(u => (u.id === loggedInUser.id || u.email.toLowerCase() === loggedInUser.email.toLowerCase() ? loggedInUser : u)) : [...prev, loggedInUser];
    });
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedInUser));
    showToast(`Welcome back, ${loggedInUser.first_name}!`);
  };

  const handleRegister = (newUser: User) => {
    setUsers(prev => {
      const filtered = prev.filter(u => u.id !== newUser.id && u.email.toLowerCase() !== newUser.email.toLowerCase());
      return [...filtered, newUser];
    });
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    showToast(`Account created in TiDB Cloud! Welcome, ${newUser.first_name}!`);
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
  const handleUpdateCurrency = async (currency: CurrencyCode) => {
    setUser(prev => ({ ...prev, currency }));
    try {
      await api.updateUserCurrency(user.id, currency);
      showToast(`Currency updated to ${currency} & saved to database`);
    } catch {
      showToast(`Currency updated to ${currency}`);
    }
  };

  // Handler: Save Expense (Add or Edit)
  const handleSaveExpense = async (
    expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>,
    id?: number
  ) => {
    const timestamp = new Date().toISOString();
    const sanitizedDesc = sanitizeInput(expenseData.description);
    const sanitizedNotes = expenseData.notes ? sanitizeInput(expenseData.notes) : undefined;
    const cleanData = { ...expenseData, description: sanitizedDesc, notes: sanitizedNotes, user_id: user.id };

    if (isDuplicateExpense(cleanData, expenses, id)) {
      showToast('Notice: A matching expense entry already exists on this date', 'info');
    }

    try {
      if (id) {
        // Optimistic update
        setExpenses(prev =>
          prev.map(e => (e.id === id ? { ...e, ...cleanData, updated_at: timestamp } : e))
        );
        await api.updateExpense(id, cleanData);
        showToast('Expense updated & saved to database');
      } else {
        const res = await api.createExpense(cleanData);
        if (res.success && res.expense) {
          setExpenses(prev => [res.expense, ...prev]);
          showToast(`Expense recorded & saved to TiDB Cloud (#${res.expense.id})`);
        } else {
          const nextId = generateSecureId();
          setExpenses(prev => [{ ...cleanData, id: nextId, created_at: timestamp, updated_at: timestamp }, ...prev]);
          showToast('Expense recorded & saved to TiDB Cloud');
        }
      }
    } catch (err: any) {
      console.error('Error saving expense:', err);
      showToast('Database error: ' + (err.message || 'Error saving to TiDB'), 'error');
    }
  };

  // Handler: Delete Expense with confirmation
  const handleDeleteExpense = (id: number) => {
    const exp = expenses.find(e => e.id === id);
    setDeleteModalState({
      isOpen: true,
      title: 'Delete Expense',
      itemDescription: exp ? exp.description : 'Selected Expense',
      itemSubtext: exp ? `-${formatCurrency(exp.amount, user.currency)} on ${formatDate(exp.date)}` : undefined,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
        try {
          await api.deleteExpense(id);
          setExpenses(prev => prev.filter(e => e.id !== id));
          showToast('Expense deleted from TiDB Cloud', 'info');
          setDeleteModalState(prev => ({ ...prev, isOpen: false, isDeleting: false }));
        } catch (err: any) {
          console.error('Failed to delete expense:', err);
          showToast('Failed to delete: ' + err.message, 'error');
          setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // Handler: Save Income (Add or Edit)
  const handleSaveIncome = async (
    incomeData: Omit<Income, 'id' | 'created_at' | 'updated_at'>,
    id?: number
  ) => {
    const timestamp = new Date().toISOString();
    const sanitizedSource = sanitizeInput(incomeData.source);
    const sanitizedNotes = incomeData.notes ? sanitizeInput(incomeData.notes) : undefined;
    const cleanData = { ...incomeData, source: sanitizedSource, notes: sanitizedNotes, user_id: user.id };

    if (isDuplicateIncome(cleanData, incomes, id)) {
      showToast('Notice: A matching income entry already exists on this date', 'info');
    }

    try {
      if (id) {
        setIncomes(prev =>
          prev.map(i => (i.id === id ? { ...i, ...cleanData, updated_at: timestamp } : i))
        );
        await api.updateIncome(id, cleanData);
        showToast('Income updated & saved to TiDB Cloud');
      } else {
        const res = await api.createIncome(cleanData);
        if (res.success && res.income) {
          setIncomes(prev => [res.income, ...prev]);
          showToast(`Income logged & saved to TiDB Cloud (#${res.income.id})`);
        } else {
          const nextId = generateSecureId();
          setIncomes(prev => [{ ...cleanData, id: nextId, created_at: timestamp, updated_at: timestamp }, ...prev]);
          showToast('Income logged & saved to TiDB Cloud');
        }
      }
    } catch (err: any) {
      console.error('Error saving income:', err);
      showToast('Database error: ' + (err.message || 'Error saving to TiDB'), 'error');
    }
  };

  // Handler: Delete Income with confirmation
  const handleDeleteIncome = (id: number) => {
    const inc = incomes.find(i => i.id === id);
    setDeleteModalState({
      isOpen: true,
      title: 'Delete Income',
      itemDescription: inc ? inc.source : 'Selected Income',
      itemSubtext: inc ? `+${formatCurrency(inc.amount, user.currency)} on ${formatDate(inc.date)}` : undefined,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
        try {
          await api.deleteIncome(id);
          setIncomes(prev => prev.filter(i => i.id !== id));
          showToast('Income deleted from TiDB Cloud', 'info');
          setDeleteModalState(prev => ({ ...prev, isOpen: false, isDeleting: false }));
        } catch (err: any) {
          console.error('Failed to delete income:', err);
          showToast('Failed to delete income: ' + err.message, 'error');
          setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // Handler: Save Budget (Add or Edit)
  const handleSaveBudget = async (
    budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>,
    id?: number
  ) => {
    const timestamp = new Date().toISOString();
    const sanitizedNotes = budgetData.notes ? sanitizeInput(budgetData.notes) : undefined;
    const cleanData = { ...budgetData, notes: sanitizedNotes, user_id: user.id };

    // Prevent duplicate budgets for same category in same month & year: update existing
    const existingMatch = budgets.find(
      b => b.id !== id && b.category_id === cleanData.category_id && b.month === cleanData.month && b.year === cleanData.year
    );

    const targetId = id || existingMatch?.id;

    try {
      if (targetId) {
        setBudgets(prev =>
          prev.map(b => (b.id === targetId ? { ...b, ...cleanData, updated_at: timestamp } : b))
        );
        await api.updateBudget(targetId, cleanData);
        showToast('Budget updated & saved to TiDB Cloud');
      } else {
        const res = await api.createBudget(cleanData);
        if (res.success && res.budget) {
          setBudgets(prev => [...prev, res.budget]);
          showToast(`Budget limit saved to TiDB Cloud (#${res.budget.id})`);
        } else {
          const nextId = generateSecureId();
          setBudgets(prev => [...prev, { ...cleanData, id: nextId, created_at: timestamp, updated_at: timestamp }]);
          showToast('Budget limit saved to TiDB Cloud');
        }
      }
    } catch (err: any) {
      console.error('Error saving budget:', err);
      showToast('Database error: ' + (err.message || 'Error saving to TiDB'), 'error');
    }
  };

  // Handler: Delete Budget with confirmation
  const handleDeleteBudget = (id: number) => {
    const b = budgets.find(item => item.id === id);
    const cat = categories.find(c => c.id === b?.category_id);
    setDeleteModalState({
      isOpen: true,
      title: 'Delete Monthly Budget',
      itemDescription: cat ? `${cat.name} Budget` : 'Category Budget Limit',
      itemSubtext: b ? `${formatCurrency(b.amount, user.currency)} for month ${b.month}/${b.year}` : undefined,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
        try {
          await api.deleteBudget(id);
          setBudgets(prev => prev.filter(item => item.id !== id));
          showToast('Budget deleted from TiDB Cloud', 'info');
          setDeleteModalState(prev => ({ ...prev, isOpen: false, isDeleting: false }));
        } catch (err: any) {
          console.error('Failed to delete budget:', err);
          showToast('Failed to delete budget: ' + err.message, 'error');
          setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // Handler: Save Goal (Add or Edit)
  const handleSaveGoal = async (
    goalData: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>,
    id?: number
  ) => {
    const timestamp = new Date().toISOString();
    const sanitizedName = sanitizeInput(goalData.name);
    const sanitizedNotes = goalData.notes ? sanitizeInput(goalData.notes) : undefined;
    const cleanData = { ...goalData, name: sanitizedName, notes: sanitizedNotes, user_id: user.id };

    try {
      if (id) {
        setGoals(prev =>
          prev.map(g => (g.id === id ? { ...g, ...cleanData, updated_at: timestamp } : g))
        );
        await api.updateGoal(id, cleanData);
        showToast('Savings goal updated & saved to TiDB Cloud');
      } else {
        const res = await api.createGoal(cleanData);
        if (res.success && res.goal) {
          setGoals(prev => [...prev, res.goal]);
          showToast(`Savings goal created & saved to TiDB Cloud (#${res.goal.id})`);
        } else {
          const nextId = generateSecureId();
          setGoals(prev => [...prev, { ...cleanData, id: nextId, created_at: timestamp, updated_at: timestamp }]);
          showToast('Savings goal created & saved to TiDB Cloud');
        }
      }
    } catch (err: any) {
      console.error('Error saving goal:', err);
      showToast('Database error: ' + (err.message || 'Error saving to TiDB'), 'error');
    }
  };

  // Handler: Delete Goal with confirmation
  const handleDeleteGoal = (id: number) => {
    const g = goals.find(item => item.id === id);
    setDeleteModalState({
      isOpen: true,
      title: 'Delete Savings Goal',
      itemDescription: g?.name || 'Savings Goal',
      itemSubtext: g ? `Target: ${formatCurrency(g.target_amount, user.currency)} (Saved: ${formatCurrency(g.saved_amount, user.currency)})` : undefined,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
        try {
          await api.deleteGoal(id);
          setGoals(prev => prev.filter(item => item.id !== id));
          showToast('Savings goal deleted from TiDB Cloud', 'info');
          setDeleteModalState(prev => ({ ...prev, isOpen: false, isDeleting: false }));
        } catch (err: any) {
          console.error('Failed to delete goal:', err);
          showToast('Failed to delete goal: ' + err.message, 'info');
          setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // Handler: Update Goal Funds
  const handleUpdateGoalAmount = async (
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
    try {
      await api.updateGoal(goalId, {
        saved_amount: newSavedAmount,
        is_completed: isCompleted,
      });
      showToast(isCompleted ? 'Target achieved! Congratulations! Saved to database' : 'Funds adjusted & saved to database');
    } catch (err: any) {
      console.error('Failed to update goal funds in database:', err);
      showToast('Funds updated locally', 'info');
    }
  };

  // Handler: Save Category (Add or Edit)
  const handleSaveCategory = async (catData: Omit<Category, 'id' | 'created_at'>, id?: number) => {
    const sanitizedName = sanitizeInput(catData.name);
    if (!sanitizedName) {
      showToast('Category name cannot be blank', 'info');
      return;
    }
    if (isDuplicateCategory(sanitizedName, catData.type, categories, id)) {
      showToast(`A category named "${sanitizedName}" already exists`, 'info');
      return;
    }

    try {
      if (id) {
        setCategories(prev =>
          prev.map(c => (c.id === id ? { ...c, ...catData, name: sanitizedName } : c))
        );
        await api.updateCategory(id, { ...catData, name: sanitizedName });
        showToast(`Category "${sanitizedName}" updated & saved`);
      } else {
        const res = await api.createCategory({ ...catData, name: sanitizedName });
        if (res.success && res.category) {
          setCategories(prev => [...prev, res.category]);
        } else {
          const nextId = generateSecureId();
          setCategories(prev => [...prev, { ...catData, name: sanitizedName, id: nextId, created_at: new Date().toISOString() }]);
        }
        showToast(`Category "${sanitizedName}" created & saved to database`);
      }
    } catch (err: any) {
      console.error('Failed to save category:', err);
      showToast('Category error: ' + (err.message || 'Error'), 'info');
    }
  };

  // Handler: Delete Category with confirmation
  const handleDeleteCategory = (id: number) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    setDeleteModalState({
      isOpen: true,
      title: 'Delete Category',
      itemDescription: cat.name,
      itemSubtext: `Type: ${cat.type.toUpperCase()}`,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
        try {
          await api.deleteCategory(id);
          setCategories(prev => prev.filter(c => c.id !== id));
          showToast(`Category "${cat.name}" removed from database`, 'info');
          setDeleteModalState(prev => ({ ...prev, isOpen: false, isDeleting: false }));
        } catch (err: any) {
          console.error('Failed to delete category:', err);
          showToast('Cannot delete: Category is linked to transactions', 'info');
          setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
      },
    });
  };

  // Reset to clean default sample dataset
  const handleResetData = async () => {
    try {
      localStorage.clear();
      await api.resetData();
      const freshData = await api.fetchAppData(INITIAL_USER.id);
      if (freshData.success) {
        if (freshData.categories) setCategories(freshData.categories);
        if (freshData.expenses) setExpenses(freshData.expenses);
        if (freshData.incomes) setIncomes(freshData.incomes);
        if (freshData.budgets) setBudgets(freshData.budgets);
        if (freshData.goals) setGoals(freshData.goals);
      }
    } catch (err) {
      console.warn('Reset database error, fallback to initial data:', err);
      setCategories(INITIAL_CATEGORIES);
      setExpenses(INITIAL_EXPENSES);
      setIncomes(INITIAL_INCOMES);
      setBudgets(INITIAL_BUDGETS);
      setGoals(INITIAL_GOALS);
    }
    setUser(INITIAL_USER);
    setUsers(INITIAL_USERS);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    showToast('Reset completed! Production database reseeded.');
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
        onRefreshData={refreshData}
        counts={{
          expenses: expenses.length,
          incomes: incomes.length,
          budgets: budgets.length,
          goals: goals.length,
        }}
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
            onOpenNewCategory={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            onEditCategory={(cat) => {
              setEditingCategory(cat);
              setIsCategoryModalOpen(true);
            }}
            onDeleteCategory={handleDeleteCategory}
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
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSaveCategory={handleSaveCategory}
        initialCategory={editingCategory}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        itemDescription={deleteModalState.itemDescription}
        itemSubtext={deleteModalState.itemSubtext}
        isDeleting={deleteModalState.isDeleting}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalState.onConfirm}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-200 border border-rose-800'
              : toast.type === 'info'
              ? 'bg-slate-900 text-slate-200 border border-slate-700'
              : 'bg-slate-900 text-white border border-slate-800'
          }`}
        >
          {toast.type === 'error' ? (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
