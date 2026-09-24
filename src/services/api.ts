import { User, Category, Expense, Income, Budget, SavingsGoal, CurrencyCode } from '../types';

export interface HealthResponse {
  ok: boolean;
  status: string;
  database: string;
  engine: string;
  host: string;
  port: number;
  databaseName: string;
  version: string;
}

export interface AppDataResponse {
  success: boolean;
  users: User[];
  categories: Category[];
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  goals: SavingsGoal[];
}

export const api = {
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async fetchAppData(userId: number): Promise<AppDataResponse> {
    const res = await fetch(`/api/data?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch data from database');
    return res.json();
  },

  async login(identifier: string, password: string): Promise<{ success: boolean; user: User; message?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async register(userData: Partial<User> & { password?: string }): Promise<{ success: boolean; user: User; message?: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Password reset failed');
    return data;
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; expense: Expense }> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to create expense');
    return data;
  },

  async updateExpense(id: number, expense: Partial<Expense>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to update expense');
    return data;
  },

  async deleteExpense(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete expense');
    return data;
  },

  async createIncome(income: Omit<Income, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; income: Income }> {
    const res = await fetch('/api/incomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(income),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to create income');
    return data;
  },

  async updateIncome(id: number, income: Partial<Income>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/incomes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(income),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to update income');
    return data;
  },

  async deleteIncome(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/incomes/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete income');
    return data;
  },

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; budget: Budget }> {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to create budget');
    return data;
  },

  async updateBudget(id: number, budget: Partial<Budget>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to update budget');
    return data;
  },

  async deleteBudget(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete budget');
    return data;
  },

  async createGoal(goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; goal: SavingsGoal }> {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to create savings goal');
    return data;
  },

  async updateGoal(id: number, goal: Partial<SavingsGoal>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to update goal');
    return data;
  },

  async addGoalFunds(id: number, amount: number): Promise<{ success: boolean; saved_amount: number; is_completed: boolean }> {
    const res = await fetch(`/api/goals/${id}/funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to fund goal');
    return data;
  },

  async deleteGoal(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete goal');
    return data;
  },

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<{ success: boolean; category: Category }> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to create category');
    return data;
  },

  async updateCategory(id: number, category: Partial<Category>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to update category');
    return data;
  },

  async deleteCategory(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete category');
    return data;
  },

  async updateUserCurrency(userId: number, currency: CurrencyCode): Promise<{ success: boolean }> {
    const res = await fetch('/api/user/currency', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currency }),
    });
    if (!res.ok) throw new Error('Failed to update currency');
    return res.json();
  },

  async resetData(): Promise<{ success: boolean }> {
    const res = await fetch('/api/reset-data', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset data');
    return res.json();
  },
};
