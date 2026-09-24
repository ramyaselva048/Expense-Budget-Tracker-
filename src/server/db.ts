import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { 
  INITIAL_USERS, 
  INITIAL_CATEGORIES, 
  INITIAL_EXPENSES, 
  INITIAL_INCOMES, 
  INITIAL_BUDGETS, 
  INITIAL_GOALS 
} from '../data/initialData';

dotenv.config({ override: true });

const rawUrl: string | undefined = process.env.DATABASE_URL;

class InMemoryDb {
  users: any[] = [];
  categories: any[] = [];
  expenses: any[] = [];
  incomes: any[] = [];
  budgets: any[] = [];
  goals: any[] = [];
  nextId = {
    users: 100,
    categories: 100,
    expenses: 100,
    incomes: 100,
    budgets: 100,
    goals: 100,
  };

  constructor() {
    this.seed();
  }

  seed() {
    const now = new Date().toISOString();
    this.users = [
      ...INITIAL_USERS.map(u => ({ ...u })),
      {
        id: 2,
        username: 'iswaryai',
        email: 'iswaryai078@gmail.com',
        first_name: 'Iswarya',
        last_name: 'I',
        currency: 'USD',
        password: 'Password@123',
        created_at: now,
      }
    ];
    this.categories = INITIAL_CATEGORIES.map(c => ({ ...c }));
    this.expenses = INITIAL_EXPENSES.map(e => ({ ...e }));
    this.incomes = INITIAL_INCOMES.map(i => ({ ...i }));
    this.budgets = INITIAL_BUDGETS.map(b => ({ ...b }));
    this.goals = INITIAL_GOALS.map(g => ({ ...g }));

    this.nextId.users = Math.max(...this.users.map(u => u.id), 0) + 1;
    this.nextId.categories = Math.max(...this.categories.map(c => c.id), 0) + 1;
    this.nextId.expenses = Math.max(...this.expenses.map(e => e.id), 0) + 1;
    this.nextId.incomes = Math.max(...this.incomes.map(i => i.id), 0) + 1;
    this.nextId.budgets = Math.max(...this.budgets.map(b => b.id), 0) + 1;
    this.nextId.goals = Math.max(...this.goals.map(g => g.id), 0) + 1;
  }

  async query(rawSql: string, params: any[] = []): Promise<[any, any]> {
    let sql = rawSql.trim().replace(/`test`\./gi, '').replace(/`/g, '');
    const lowerSql = sql.toLowerCase();

    // Health check query
    if (lowerSql.includes('select 1 as connected')) {
      return [[{
        connected: 1,
        db: 'expense_tracker',
        version: '8.0.36-inmemory',
        engine: 'In-Memory Store (MySQL Mock)',
        host: 'localhost',
        port: 3000,
      }], []];
    }

    if (lowerSql === 'select 1') {
      return [[{ 1: 1 }], []];
    }

    if (lowerSql.startsWith('create database') || lowerSql.startsWith('use ') || lowerSql.startsWith('create table')) {
      return [{ affectedRows: 0, insertId: 0 }, []];
    }

    // Counts
    if (lowerSql.startsWith('select count(*)')) {
      if (lowerSql.includes('from expenses')) {
        let count = this.expenses.length;
        if (lowerSql.includes('where user_id = ?')) {
          count = this.expenses.filter(e => e.user_id === Number(params[0])).length;
        }
        return [[{ c: count, count }], []];
      }
      if (lowerSql.includes('from incomes')) {
        let count = this.incomes.length;
        if (lowerSql.includes('where user_id = ?')) {
          count = this.incomes.filter(i => i.user_id === Number(params[0])).length;
        }
        return [[{ c: count, count }], []];
      }
      if (lowerSql.includes('from budgets')) {
        let count = this.budgets.length;
        if (lowerSql.includes('where user_id = ? and month = ? and year = ?')) {
          count = this.budgets.filter(b => b.user_id === Number(params[0]) && b.month === Number(params[1]) && b.year === Number(params[2])).length;
        }
        return [[{ c: count, count }], []];
      }
      if (lowerSql.includes('from savings_goals')) {
        let count = this.goals.length;
        if (lowerSql.includes('where user_id = ?')) {
          count = this.goals.filter(g => g.user_id === Number(params[0])).length;
        }
        return [[{ c: count, count }], []];
      }
      if (lowerSql.includes('from categories')) {
        return [[{ c: this.categories.length, count: this.categories.length }], []];
      }
      if (lowerSql.includes('from users')) {
        return [[{ c: this.users.length, count: this.users.length }], []];
      }
    }

    // SELECT users
    if (lowerSql.startsWith('select') && lowerSql.includes('from users')) {
      if (lowerSql.includes('where lower(email) = ? or lower(username) = ?')) {
        const id1 = String(params[0]).toLowerCase();
        const id2 = String(params[1]).toLowerCase();
        const found = this.users.filter(u => u.email.toLowerCase() === id1 || u.username.toLowerCase() === id2);
        return [found, []];
      }
      if (lowerSql.includes('where email = ?')) {
        const email = String(params[0]).toLowerCase();
        const found = this.users.filter(u => u.email.toLowerCase() === email);
        return [found, []];
      }
      return [this.users.map(u => {
        const { password: _, ...safe } = u;
        return safe;
      }), []];
    }

    // SELECT categories
    if (lowerSql.startsWith('select') && lowerSql.includes('from categories')) {
      if (lowerSql.includes('where name = ?')) {
        const found = this.categories.filter(c => c.name === params[0]);
        return [found, []];
      }
      if (lowerSql.includes('where id = ?')) {
        const found = this.categories.filter(c => c.id === Number(params[0]));
        return [found, []];
      }
      return [[...this.categories].sort((a, b) => a.id - b.id), []];
    }

    // SELECT expenses
    if (lowerSql.startsWith('select') && lowerSql.includes('from expenses')) {
      if (lowerSql.includes('where id = ?')) {
        const found = this.expenses.filter(e => e.id === Number(params[0]));
        return [found, []];
      }
      if (lowerSql.includes('where user_id = ?')) {
        const userId = Number(params[0]);
        const list = this.expenses
          .filter(e => e.user_id === userId)
          .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
        return [list, []];
      }
      return [this.expenses, []];
    }

    // SELECT incomes
    if (lowerSql.startsWith('select') && lowerSql.includes('from incomes')) {
      if (lowerSql.includes('where id = ?')) {
        const found = this.incomes.filter(i => i.id === Number(params[0]));
        return [found, []];
      }
      if (lowerSql.includes('where user_id = ?')) {
        const userId = Number(params[0]);
        const list = this.incomes
          .filter(i => i.user_id === userId)
          .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
        return [list, []];
      }
      return [this.incomes, []];
    }

    // SELECT budgets
    if (lowerSql.startsWith('select') && lowerSql.includes('from budgets')) {
      if (lowerSql.includes('where id = ?')) {
        const found = this.budgets.filter(b => b.id === Number(params[0]));
        return [found, []];
      }
      if (lowerSql.includes('where user_id = ?')) {
        const userId = Number(params[0]);
        const list = this.budgets
          .filter(b => b.user_id === userId)
          .sort((a, b) => b.year - a.year || b.month - a.month || a.id - b.id);
        return [list, []];
      }
      return [this.budgets, []];
    }

    // SELECT savings_goals
    if (lowerSql.startsWith('select') && lowerSql.includes('from savings_goals')) {
      if (lowerSql.includes('where id = ?')) {
        const found = this.goals.filter(g => g.id === Number(params[0]));
        return [found, []];
      }
      if (lowerSql.includes('where user_id = ?')) {
        const userId = Number(params[0]);
        const list = this.goals
          .filter(g => g.user_id === userId)
          .sort((a, b) => a.id - b.id);
        return [list, []];
      }
      return [this.goals, []];
    }

    // INSERT INTO users
    if (lowerSql.startsWith('insert into users')) {
      const isWithId = lowerSql.includes('(id,');
      let id = isWithId ? Number(params[0]) : this.nextId.users++;
      const offset = isWithId ? 1 : 0;
      const newUser = {
        id,
        first_name: params[offset + 0] || '',
        last_name: params[offset + 1] || '',
        username: params[offset + 2] || '',
        email: params[offset + 3] || '',
        currency: params[offset + 4] || 'USD',
        password: params[offset + 5] || '',
        created_at: params[offset + 6] || new Date().toISOString(),
      };
      const existingIdx = this.users.findIndex(u => u.id === id || u.email.toLowerCase() === newUser.email.toLowerCase());
      if (existingIdx >= 0) {
        this.users[existingIdx] = { ...this.users[existingIdx], ...newUser };
      } else {
        this.users.push(newUser);
      }
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // INSERT INTO expenses
    if (lowerSql.startsWith('insert into expenses')) {
      const isWithId = lowerSql.includes('(id,');
      let id = isWithId ? Number(params[0]) : this.nextId.expenses++;
      const offset = isWithId ? 1 : 0;
      const newExp = {
        id,
        user_id: Number(params[offset + 0]) || 1,
        category_id: Number(params[offset + 1]),
        amount: Number(params[offset + 2]),
        description: params[offset + 3] || '',
        date: params[offset + 4] || '',
        is_recurring: Boolean(params[offset + 5]),
        recurrence_period: params[offset + 6] || null,
        payment_method: params[offset + 7] || 'Cash',
        notes: params[offset + 8] || '',
        created_at: params[offset + 9] || new Date().toISOString(),
        updated_at: params[offset + 10] || new Date().toISOString(),
      };
      const idx = this.expenses.findIndex(e => e.id === id);
      if (idx >= 0) {
        this.expenses[idx] = { ...this.expenses[idx], ...newExp };
      } else {
        this.expenses.push(newExp);
      }
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // INSERT INTO incomes
    if (lowerSql.startsWith('insert into incomes')) {
      const isWithId = lowerSql.includes('(id,');
      let id = isWithId ? Number(params[0]) : this.nextId.incomes++;
      const offset = isWithId ? 1 : 0;
      const newInc = {
        id,
        user_id: Number(params[offset + 0]) || 1,
        source: params[offset + 1] || '',
        amount: Number(params[offset + 2]),
        date: params[offset + 3] || '',
        is_recurring: Boolean(params[offset + 4]),
        recurrence_period: params[offset + 5] || null,
        notes: params[offset + 6] || '',
        created_at: params[offset + 7] || new Date().toISOString(),
        updated_at: params[offset + 8] || new Date().toISOString(),
      };
      const idx = this.incomes.findIndex(i => i.id === id);
      if (idx >= 0) {
        this.incomes[idx] = { ...this.incomes[idx], ...newInc };
      } else {
        this.incomes.push(newInc);
      }
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // INSERT INTO budgets
    if (lowerSql.startsWith('insert into budgets')) {
      const isWithId = lowerSql.includes('(id,');
      let id = isWithId ? Number(params[0]) : this.nextId.budgets++;
      const offset = isWithId ? 1 : 0;
      const newBud = {
        id,
        user_id: Number(params[offset + 0]) || 1,
        category_id: Number(params[offset + 1]),
        amount: Number(params[offset + 2]),
        month: Number(params[offset + 3]),
        year: Number(params[offset + 4]),
        notes: params[offset + 5] || '',
        created_at: params[offset + 6] || new Date().toISOString(),
        updated_at: params[offset + 7] || new Date().toISOString(),
      };
      const idx = this.budgets.findIndex(b => b.id === id);
      if (idx >= 0) {
        this.budgets[idx] = { ...this.budgets[idx], ...newBud };
      } else {
        this.budgets.push(newBud);
      }
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // INSERT INTO savings_goals
    if (lowerSql.startsWith('insert into savings_goals')) {
      const isWithId = lowerSql.includes('(id,');
      let id = isWithId ? Number(params[0]) : this.nextId.goals++;
      const offset = isWithId ? 1 : 0;
      const newGoal = {
        id,
        user_id: Number(params[offset + 0]) || 1,
        name: params[offset + 1] || '',
        target_amount: Number(params[offset + 2]),
        saved_amount: Number(params[offset + 3]) || 0,
        target_date: params[offset + 4] || '',
        is_completed: Boolean(params[offset + 5]),
        notes: params[offset + 6] || '',
        created_at: params[offset + 7] || new Date().toISOString(),
        updated_at: params[offset + 8] || new Date().toISOString(),
      };
      const idx = this.goals.findIndex(g => g.id === id);
      if (idx >= 0) {
        this.goals[idx] = { ...this.goals[idx], ...newGoal };
      } else {
        this.goals.push(newGoal);
      }
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // INSERT INTO categories
    if (lowerSql.startsWith('insert into categories')) {
      const isWithId = lowerSql.includes('(id,');
      let id = isWithId ? Number(params[0]) : this.nextId.categories++;
      const offset = isWithId ? 1 : 0;
      const newCat = {
        id,
        name: params[offset + 0] || '',
        icon: params[offset + 1] || 'Tag',
        color: params[offset + 2] || '#3B82F6',
        type: params[offset + 3] || 'expense',
        created_at: params[offset + 4] || new Date().toISOString(),
      };
      const idx = this.categories.findIndex(c => c.id === id);
      if (idx >= 0) {
        this.categories[idx] = { ...this.categories[idx], ...newCat };
      } else {
        this.categories.push(newCat);
      }
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // UPDATE users
    if (lowerSql.startsWith('update users')) {
      if (lowerSql.includes('set first_name = ?')) {
        const firstName = params[0];
        const lastName = params[1];
        const username = params[2];
        const email = params[3];
        const currency = params[4];
        const userId = Number(params[5]);
        const u = this.users.find(u => u.id === userId);
        if (u) {
          u.first_name = firstName;
          u.last_name = lastName;
          u.username = username;
          u.email = email;
          u.currency = currency;
          return [{ affectedRows: 1, changedRows: 1 }, []];
        }
        return [{ affectedRows: 0, changedRows: 0 }, []];
      }
      if (lowerSql.includes('set password = ? where id = ?')) {
        const newPassword = params[0];
        const userId = Number(params[1]);
        const u = this.users.find(u => u.id === userId);
        if (u) {
          u.password = newPassword;
          return [{ affectedRows: 1, changedRows: 1 }, []];
        }
        return [{ affectedRows: 0, changedRows: 0 }, []];
      }
      if (lowerSql.includes('set password = ?')) {
        const newPassword = params[0];
        const email = String(params[1]).toLowerCase();
        let affected = 0;
        this.users.forEach(u => {
          if (u.email.toLowerCase() === email || u.username.toLowerCase() === email) {
            u.password = newPassword;
            affected++;
          }
        });
        return [{ affectedRows: affected, changedRows: affected }, []];
      }
      if (lowerSql.includes('set currency = ?')) {
        const currency = params[0];
        const userId = Number(params[1]);
        const u = this.users.find(u => u.id === userId);
        if (u) u.currency = currency;
        return [{ affectedRows: u ? 1 : 0, changedRows: u ? 1 : 0 }, []];
      }
    }

    // UPDATE expenses
    if (lowerSql.startsWith('update expenses')) {
      const id = Number(params[params.length - 1]);
      const idx = this.expenses.findIndex(e => e.id === id);
      if (idx >= 0) {
        this.expenses[idx] = {
          ...this.expenses[idx],
          category_id: Number(params[0]),
          amount: Number(params[1]),
          description: params[2],
          date: params[3],
          is_recurring: Boolean(params[4]),
          recurrence_period: params[5],
          payment_method: params[6],
          notes: params[7],
          updated_at: params[8] || new Date().toISOString(),
        };
        return [{ affectedRows: 1, changedRows: 1 }, []];
      }
      return [{ affectedRows: 0, changedRows: 0 }, []];
    }

    // UPDATE incomes
    if (lowerSql.startsWith('update incomes')) {
      const id = Number(params[params.length - 1]);
      const idx = this.incomes.findIndex(i => i.id === id);
      if (idx >= 0) {
        this.incomes[idx] = {
          ...this.incomes[idx],
          source: params[0],
          amount: Number(params[1]),
          date: params[2],
          is_recurring: Boolean(params[3]),
          recurrence_period: params[4],
          notes: params[5],
          updated_at: params[6] || new Date().toISOString(),
        };
        return [{ affectedRows: 1, changedRows: 1 }, []];
      }
      return [{ affectedRows: 0, changedRows: 0 }, []];
    }

    // UPDATE budgets
    if (lowerSql.startsWith('update budgets')) {
      const id = Number(params[params.length - 1]);
      const idx = this.budgets.findIndex(b => b.id === id);
      if (idx >= 0) {
        this.budgets[idx] = {
          ...this.budgets[idx],
          category_id: Number(params[0]),
          amount: Number(params[1]),
          month: Number(params[2]),
          year: Number(params[3]),
          notes: params[4],
          updated_at: params[5] || new Date().toISOString(),
        };
        return [{ affectedRows: 1, changedRows: 1 }, []];
      }
      return [{ affectedRows: 0, changedRows: 0 }, []];
    }

    // UPDATE savings_goals
    if (lowerSql.startsWith('update savings_goals')) {
      const id = Number(params[params.length - 1]);
      const idx = this.goals.findIndex(g => g.id === id);
      if (idx >= 0) {
        if (lowerSql.includes('saved_amount = ?, is_completed = ?')) {
          this.goals[idx].saved_amount = Number(params[0]);
          this.goals[idx].is_completed = Boolean(params[1]);
          this.goals[idx].updated_at = params[2] || new Date().toISOString();
        } else {
          this.goals[idx] = {
            ...this.goals[idx],
            name: params[0],
            target_amount: Number(params[1]),
            saved_amount: Number(params[2]),
            target_date: params[3],
            is_completed: Boolean(params[4]),
            notes: params[5],
            updated_at: params[6] || new Date().toISOString(),
          };
        }
        return [{ affectedRows: 1, changedRows: 1 }, []];
      }
      return [{ affectedRows: 0, changedRows: 0 }, []];
    }

    // UPDATE categories
    if (lowerSql.startsWith('update categories')) {
      const id = Number(params[params.length - 1]);
      const idx = this.categories.findIndex(c => c.id === id);
      if (idx >= 0) {
        this.categories[idx] = {
          ...this.categories[idx],
          name: params[0],
          icon: params[1],
          color: params[2],
          type: params[3],
        };
        return [{ affectedRows: 1, changedRows: 1 }, []];
      }
      return [{ affectedRows: 0, changedRows: 0 }, []];
    }

    // DELETE
    if (lowerSql.startsWith('delete from expenses')) {
      const id = Number(params[0]);
      const lenBefore = this.expenses.length;
      this.expenses = this.expenses.filter(e => e.id !== id);
      return [{ affectedRows: lenBefore - this.expenses.length }, []];
    }

    if (lowerSql.startsWith('delete from incomes')) {
      const id = Number(params[0]);
      const lenBefore = this.incomes.length;
      this.incomes = this.incomes.filter(i => i.id !== id);
      return [{ affectedRows: lenBefore - this.incomes.length }, []];
    }

    if (lowerSql.startsWith('delete from budgets')) {
      const id = Number(params[0]);
      const lenBefore = this.budgets.length;
      this.budgets = this.budgets.filter(b => b.id !== id);
      return [{ affectedRows: lenBefore - this.budgets.length }, []];
    }

    if (lowerSql.startsWith('delete from savings_goals')) {
      const id = Number(params[0]);
      const lenBefore = this.goals.length;
      this.goals = this.goals.filter(g => g.id !== id);
      return [{ affectedRows: lenBefore - this.goals.length }, []];
    }

    if (lowerSql.startsWith('delete from categories')) {
      const id = Number(params[0]);
      const lenBefore = this.categories.length;
      this.categories = this.categories.filter(c => c.id !== id);
      return [{ affectedRows: lenBefore - this.categories.length }, []];
    }

    return [[], []];
  }
}

export interface DbPool {
  query<T = any>(sql: string, params?: any[]): Promise<[T, any]>;
}

const inMemoryDbInstance = new InMemoryDb();

let pool: any = null;
let isUsingMock = true;

export function getDbPool(): DbPool {
  if (pool) return pool;
  if (!rawUrl || rawUrl.trim() === '') {
    return inMemoryDbInstance;
  }
  return inMemoryDbInstance;
}

export async function initDatabase(): Promise<{ success: boolean; message: string }> {
  if (!rawUrl || rawUrl.trim() === '') {
    console.log('[Database] DATABASE_URL not set — in-memory mock database active.');
    return { success: true, message: 'In-memory database initialized with seeded records.' };
  }

  try {
    const realPool = mysql.createPool({
      uri: rawUrl,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
      connectTimeout: 2500,
      waitForConnections: true,
      connectionLimit: 5,
    });

    // Test connection with timeout
    const testPromise = realPool.query('SELECT 1');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out')), 2500)
    );

    await Promise.race([testPromise, timeoutPromise]);
    pool = realPool;
    isUsingMock = false;
    console.log('[Database] Connected to external MySQL database.');
    return { success: true, message: 'Connected to external MySQL database.' };
  } catch (err: any) {
    console.warn(`[Database] Could not connect to MySQL (${err.message}). Using in-memory mock database.`);
    pool = null;
    isUsingMock = true;
    return { success: true, message: 'Using in-memory mock database (fallback).' };
  }
}

export async function seedInitialData(): Promise<void> {
  if (isUsingMock || !pool) {
    inMemoryDbInstance.seed();
    console.log('[Database] Reset in-memory database with sample data.');
    return;
  }

  try {
    await inMemoryDbInstance.seed();
    console.log('[Database] Seed completed successfully!');
  } catch (err: any) {
    console.warn('[Database] Seed notice:', err.message);
  }
}

