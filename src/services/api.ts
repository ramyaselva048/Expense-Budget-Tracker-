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
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
  },

  async updateExpense(id: number, expense: Partial<Expense>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
  },

  async deleteExpense(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
  },

  async createIncome(income: Omit<Income, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; income: Income }> {
    const res = await fetch('/api/incomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(income),
    });
    if (!res.ok) throw new Error('Failed to create income');
    return res.json();
  },

  async updateIncome(id: number, income: Partial<Income>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/incomes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(income),
    });
    if (!res.ok) throw new Error('Failed to update income');
    return res.json();
  },

  async deleteIncome(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/incomes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete income');
    return res.json();
  },

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; budget: Budget }> {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    if (!res.ok) throw new Error('Failed to create budget');
    return res.json();
  },

  async updateBudget(id: number, budget: Partial<Budget>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    if (!res.ok) throw new Error('Failed to update budget');
    return res.json();
  },

  async deleteBudget(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete budget');
    return res.json();
  },

  async createGoal(goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; goal: SavingsGoal }> {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!res.ok) throw new Error('Failed to create savings goal');
    return res.json();
  },

  async updateGoal(id: number, goal: Partial<SavingsGoal>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    return res.json();
  },

  async addGoalFunds(id: number, amount: number): Promise<{ success: boolean; saved_amount: number; is_completed: boolean }> {
    const res = await fetch(`/api/goals/${id}/funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to fund goal');
    return res.json();
  },

  async deleteGoal(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete goal');
    return res.json();
  },

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<{ success: boolean; category: Category }> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async deleteCategory(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
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
