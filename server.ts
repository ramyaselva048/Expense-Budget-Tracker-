import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { getDbPool, initDatabase, seedInitialData } from './src/server/db';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize database schema and auto-seed if needed
initDatabase().then((res) => {
  console.log('[Database]', res.message);
}).catch((err) => {
  console.error('[Database Init Error]', err);
});

// API Routes

// Helper: Mirror writes to test schema for dual persistence
async function mirrorQuery(pool: any, sql: string, params: any[] = []): Promise<void> {
  try {
    const mirrorSql = sql
      .replace(/\bexpenses\b/g, '`test`.`expenses`')
      .replace(/\bincomes\b/g, '`test`.`incomes`')
      .replace(/\bbudgets\b/g, '`test`.`budgets`')
      .replace(/\bsavings_goals\b/g, '`test`.`savings_goals`')
      .replace(/\bcategories\b/g, '`test`.`categories`')
      .replace(/\busers\b/g, '`test`.`users`');
    if (mirrorSql !== sql) {
      await pool.query(mirrorSql, params);
    }
  } catch (err: any) {
    // Non-blocking background sync notice
  }
}

// 1. Health check & DB connection status
app.get('/api/health', async (_req, res) => {
  try {
    const pool = getDbPool();
    const [result] = await pool.query('SELECT 1 as connected, DATABASE() as db, VERSION() as version');
    const dbInfo = Array.isArray(result) && result[0] ? (result[0] as any) : {};
    
    // Fetch live row counts
    const [exp] = await pool.query<any[]>('SELECT COUNT(*) as c FROM expenses');
    const [inc] = await pool.query<any[]>('SELECT COUNT(*) as c FROM incomes');
    const [bud] = await pool.query<any[]>('SELECT COUNT(*) as c FROM budgets');
    const [gol] = await pool.query<any[]>('SELECT COUNT(*) as c FROM savings_goals');

    res.json({
      ok: true,
      status: 'healthy',
      database: 'connected',
      engine: dbInfo.engine || 'MySQL In-Memory Store',
      host: dbInfo.host || 'localhost',
      port: dbInfo.port || 3000,
      databaseName: dbInfo.db || 'expense_tracker',
      version: dbInfo.version || '8.0',
      counts: {
        expenses: exp[0]?.c || 0,
        incomes: inc[0]?.c || 0,
        budgets: bud[0]?.c || 0,
        goals: gol[0]?.c || 0,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// 2. Fetch all app data for logged in user
app.get('/api/data', async (req, res) => {
  try {
    const pool = getDbPool();
    const userId = Number(req.query.userId) || 1;

    const [users] = await pool.query('SELECT id, username, email, first_name, last_name, currency, created_at FROM users');
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    const [expenses] = await pool.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [userId]);
    const [incomes] = await pool.query('SELECT * FROM incomes WHERE user_id = ? ORDER BY date DESC, id DESC', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ? ORDER BY year DESC, month DESC, id ASC', [userId]);
    const [goals] = await pool.query('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY id ASC', [userId]);

    // Format boolean fields and numbers
    const formattedExpenses = (expenses as any[]).map(e => ({
      ...e,
      amount: Number(e.amount),
      is_recurring: Boolean(e.is_recurring),
    }));

    const formattedIncomes = (incomes as any[]).map(i => ({
      ...i,
      amount: Number(i.amount),
      is_recurring: Boolean(i.is_recurring),
    }));

    const formattedBudgets = (budgets as any[]).map(b => ({
      ...b,
      amount: Number(b.amount),
      month: Number(b.month),
      year: Number(b.year),
    }));

    const formattedGoals = (goals as any[]).map(g => ({
      ...g,
      target_amount: Number(g.target_amount),
      saved_amount: Number(g.saved_amount),
      is_completed: Boolean(g.is_completed),
    }));

    res.json({
      success: true,
      users,
      categories,
      expenses: formattedExpenses,
      incomes: formattedIncomes,
      budgets: formattedBudgets,
      goals: formattedGoals,
    });
  } catch (error: any) {
    console.error('[API Data Fetch Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Authentication: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Username and password are required' });
    }

    const pool = getDbPool();
    const cleanId = String(identifier).trim().toLowerCase();

    const [rows] = await pool.query<any[]>(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1',
      [cleanId, cleanId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'No account found with this email or username. Please check your credentials or create an account.' });
    }

    const user = rows[0];
    // Password verification: supports plaintext, salted SHA-256 hash, raw SHA-256 hash, or hash_ prefix
    const saltedHash = crypto.createHash('sha256').update(password + '_ebt_salt_sec_2026').digest('hex');
    const rawHash = crypto.createHash('sha256').update(password).digest('hex');

    const validPasswords = [
      password,
      saltedHash,
      rawHash,
      `hash_${password}`
    ];

    const isMatch = validPasswords.includes(user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your password or use "Reset Password".' });
    }

    const { password: _, ...userSafe } = user;
    res.json({ success: true, user: userSafe });
  } catch (error: any) {
    console.error('[Login API Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Authentication: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { first_name, last_name, username, email, currency, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }

    const pool = getDbPool();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check existing
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1',
      [cleanEmail, cleanUsername]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email or username already exists. Please log in.' });
    }

    const now = new Date().toISOString();
    const [result] = await pool.query<any>(
      `INSERT INTO users (first_name, last_name, username, email, currency, password, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name || '', last_name || '', cleanUsername, cleanEmail, currency || 'USD', password, now]
    );

    await mirrorQuery(
      pool,
      `INSERT INTO users (id, first_name, last_name, username, email, currency, password, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), currency = VALUES(currency), password = VALUES(password)`,
      [result.insertId, first_name || '', last_name || '', cleanUsername, cleanEmail, currency || 'USD', password, now]
    );

    const newUser = {
      id: result.insertId,
      first_name: first_name || '',
      last_name: last_name || '',
      username: cleanUsername,
      email: cleanEmail,
      currency: currency || 'USD',
      created_at: now,
    };

    res.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('[Register API Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Authentication: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    const pool = getDbPool();
    const cleanEmail = String(email).trim().toLowerCase();
    const [result] = await pool.query<any>(
      'UPDATE users SET password = ? WHERE LOWER(email) = ? OR LOWER(username) = ?',
      [newPassword, cleanEmail, cleanEmail]
    );

    await mirrorQuery(
      pool,
      'UPDATE users SET password = ? WHERE LOWER(email) = ? OR LOWER(username) = ?',
      [newPassword, cleanEmail, cleanEmail]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email or username' });
    }

    res.json({ success: true, message: 'Password updated successfully in database! You can now log in.' });
  } catch (error: any) {
    console.error('[Reset Password API Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Expenses CRUD
app.post('/api/expenses', async (req, res) => {
  try {
    const { user_id, category_id, amount, description, date, is_recurring, recurrence_period, payment_method, notes } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const insertParams = [
      Number(user_id) || 1,
      Number(category_id),
      Number(amount),
      description,
      date,
      Boolean(is_recurring),
      recurrence_period || null,
      payment_method || 'Cash',
      notes || '',
      now,
      now,
    ];

    const [result] = await pool.query<any>(
      `INSERT INTO expenses (user_id, category_id, amount, description, date, is_recurring, recurrence_period, payment_method, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    );

    await mirrorQuery(
      pool,
      `INSERT INTO expenses (id, user_id, category_id, amount, description, date, is_recurring, recurrence_period, payment_method, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), description = VALUES(description), date = VALUES(date), updated_at = VALUES(updated_at)`,
      [result.insertId, ...insertParams]
    );

    res.json({
      success: true,
      expense: {
        id: result.insertId,
        user_id: Number(user_id) || 1,
        category_id: Number(category_id),
        amount: Number(amount),
        description,
        date,
        is_recurring: Boolean(is_recurring),
        recurrence_period: recurrence_period || undefined,
        payment_method,
        notes,
        created_at: now,
        updated_at: now,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { category_id, amount, description, date, is_recurring, recurrence_period, payment_method, notes } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const [rows] = await pool.query<any[]>('SELECT * FROM expenses WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    const curr = rows[0];

    const upCategory = category_id !== undefined ? Number(category_id) : curr.category_id;
    const upAmount = amount !== undefined ? Number(amount) : curr.amount;
    const upDesc = description !== undefined ? description : curr.description;
    const upDate = date !== undefined ? date : curr.date;
    const upRecurring = is_recurring !== undefined ? Boolean(is_recurring) : Boolean(curr.is_recurring);
    const upPeriod = recurrence_period !== undefined ? recurrence_period : curr.recurrence_period;
    const upPaymentMethod = payment_method !== undefined ? payment_method : curr.payment_method;
    const upNotes = notes !== undefined ? notes : curr.notes;

    const updateSql = `UPDATE expenses 
       SET category_id = ?, amount = ?, description = ?, date = ?, is_recurring = ?, recurrence_period = ?, payment_method = ?, notes = ?, updated_at = ?
       WHERE id = ?`;
    const updateParams = [
      upCategory,
      upAmount,
      upDesc,
      upDate,
      upRecurring,
      upPeriod || null,
      upPaymentMethod,
      upNotes || '',
      now,
      id,
    ];

    await pool.query(updateSql, updateParams);
    await mirrorQuery(pool, updateSql, updateParams);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = getDbPool();
    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    await mirrorQuery(pool, 'DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Incomes CRUD
app.post('/api/incomes', async (req, res) => {
  try {
    const { user_id, source, amount, date, is_recurring, recurrence_period, notes } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const insertParams = [
      Number(user_id) || 1,
      source,
      Number(amount),
      date,
      Boolean(is_recurring),
      recurrence_period || null,
      notes || '',
      now,
      now,
    ];

    const [result] = await pool.query<any>(
      `INSERT INTO incomes (user_id, source, amount, date, is_recurring, recurrence_period, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    );

    await mirrorQuery(
      pool,
      `INSERT INTO incomes (id, user_id, source, amount, date, is_recurring, recurrence_period, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), source = VALUES(source), date = VALUES(date), updated_at = VALUES(updated_at)`,
      [result.insertId, ...insertParams]
    );

    res.json({
      success: true,
      income: {
        id: result.insertId,
        user_id: Number(user_id) || 1,
        source,
        amount: Number(amount),
        date,
        is_recurring: Boolean(is_recurring),
        recurrence_period: recurrence_period || undefined,
        notes,
        created_at: now,
        updated_at: now,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/incomes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { source, amount, date, is_recurring, recurrence_period, notes } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const [rows] = await pool.query<any[]>('SELECT * FROM incomes WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Income not found' });
    }
    const curr = rows[0];

    const upSource = source !== undefined ? source : curr.source;
    const upAmount = amount !== undefined ? Number(amount) : curr.amount;
    const upDate = date !== undefined ? date : curr.date;
    const upRecurring = is_recurring !== undefined ? Boolean(is_recurring) : Boolean(curr.is_recurring);
    const upPeriod = recurrence_period !== undefined ? recurrence_period : curr.recurrence_period;
    const upNotes = notes !== undefined ? notes : curr.notes;

    const updateSql = `UPDATE incomes 
       SET source = ?, amount = ?, date = ?, is_recurring = ?, recurrence_period = ?, notes = ?, updated_at = ?
       WHERE id = ?`;
    const updateParams = [upSource, upAmount, upDate, upRecurring, upPeriod || null, upNotes || '', now, id];

    await pool.query(updateSql, updateParams);
    await mirrorQuery(pool, updateSql, updateParams);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/incomes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = getDbPool();
    await pool.query('DELETE FROM incomes WHERE id = ?', [id]);
    await mirrorQuery(pool, 'DELETE FROM incomes WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Budgets CRUD
app.post('/api/budgets', async (req, res) => {
  try {
    const { user_id, category_id, amount, month, year, notes } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const insertParams = [Number(user_id) || 1, Number(category_id), Number(amount), Number(month), Number(year), notes || '', now, now];

    const [result] = await pool.query<any>(
      `INSERT INTO budgets (user_id, category_id, amount, month, year, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    );

    await mirrorQuery(
      pool,
      `INSERT INTO budgets (id, user_id, category_id, amount, month, year, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), notes = VALUES(notes), updated_at = VALUES(updated_at)`,
      [result.insertId, ...insertParams]
    );

    res.json({
      success: true,
      budget: {
        id: result.insertId,
        user_id: Number(user_id) || 1,
        category_id: Number(category_id),
        amount: Number(amount),
        month: Number(month),
        year: Number(year),
        notes,
        created_at: now,
        updated_at: now,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { category_id, amount, month, year, notes } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const [rows] = await pool.query<any[]>('SELECT * FROM budgets WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    const curr = rows[0];

    const upCategory = category_id !== undefined ? Number(category_id) : curr.category_id;
    const upAmount = amount !== undefined ? Number(amount) : curr.amount;
    const upMonth = month !== undefined ? Number(month) : curr.month;
    const upYear = year !== undefined ? Number(year) : curr.year;
    const upNotes = notes !== undefined ? notes : curr.notes;

    const updateSql = `UPDATE budgets 
       SET category_id = ?, amount = ?, month = ?, year = ?, notes = ?, updated_at = ?
       WHERE id = ?`;
    const updateParams = [upCategory, upAmount, upMonth, upYear, upNotes || '', now, id];

    await pool.query(updateSql, updateParams);
    await mirrorQuery(pool, updateSql, updateParams);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = getDbPool();
    await pool.query('DELETE FROM budgets WHERE id = ?', [id]);
    await mirrorQuery(pool, 'DELETE FROM budgets WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Savings Goals CRUD
app.post('/api/goals', async (req, res) => {
  try {
    const { user_id, name, target_amount, saved_amount, target_date, is_completed, notes } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const insertParams = [
      Number(user_id) || 1,
      name,
      Number(target_amount),
      Number(saved_amount) || 0,
      target_date,
      Boolean(is_completed),
      notes || '',
      now,
      now,
    ];

    const [result] = await pool.query<any>(
      `INSERT INTO savings_goals (user_id, name, target_amount, saved_amount, target_date, is_completed, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    );

    await mirrorQuery(
      pool,
      `INSERT INTO savings_goals (id, user_id, name, target_amount, saved_amount, target_date, is_completed, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount), saved_amount = VALUES(saved_amount), is_completed = VALUES(is_completed), updated_at = VALUES(updated_at)`,
      [result.insertId, ...insertParams]
    );

    res.json({
      success: true,
      goal: {
        id: result.insertId,
        user_id: Number(user_id) || 1,
        name,
        target_amount: Number(target_amount),
        saved_amount: Number(saved_amount) || 0,
        target_date,
        is_completed: Boolean(is_completed),
        notes,
        created_at: now,
        updated_at: now,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, target_amount, saved_amount, target_date, is_completed, notes } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const [rows] = await pool.query<any[]>('SELECT * FROM savings_goals WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    const curr = rows[0];

    const upName = name !== undefined ? name : curr.name;
    const upTarget = target_amount !== undefined ? Number(target_amount) : Number(curr.target_amount);
    const upSaved = saved_amount !== undefined ? Number(saved_amount) : Number(curr.saved_amount);
    const upDate = target_date !== undefined ? target_date : curr.target_date;
    const upCompleted = is_completed !== undefined ? Boolean(is_completed) : Boolean(curr.is_completed);
    const upNotes = notes !== undefined ? notes : curr.notes;

    const updateSql = `UPDATE savings_goals 
       SET name = ?, target_amount = ?, saved_amount = ?, target_date = ?, is_completed = ?, notes = ?, updated_at = ?
       WHERE id = ?`;
    const updateParams = [upName, upTarget, upSaved, upDate, upCompleted, upNotes || '', now, id];

    await pool.query(updateSql, updateParams);
    await mirrorQuery(pool, updateSql, updateParams);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/goals/:id/funds', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { amount } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const [rows] = await pool.query<any[]>('SELECT * FROM savings_goals WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const currentGoal = rows[0];
    const newSaved = Math.max(0, Number(currentGoal.saved_amount) + Number(amount));
    const isCompleted = newSaved >= Number(currentGoal.target_amount);

    const fundsSql = 'UPDATE savings_goals SET saved_amount = ?, is_completed = ?, updated_at = ? WHERE id = ?';
    const fundsParams = [newSaved, isCompleted, now, id];

    await pool.query(fundsSql, fundsParams);
    await mirrorQuery(pool, fundsSql, fundsParams);

    res.json({ success: true, saved_amount: newSaved, is_completed: isCompleted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = getDbPool();
    await pool.query('DELETE FROM savings_goals WHERE id = ?', [id]);
    await mirrorQuery(pool, 'DELETE FROM savings_goals WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Categories CRUD
app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, color, type } = req.body;
    const pool = getDbPool();
    const now = new Date().toISOString();

    const [result] = await pool.query<any>(
      `INSERT INTO categories (name, icon, color, type, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [name, icon || 'Tag', color || '#3B82F6', type || 'expense', now]
    );

    await mirrorQuery(
      pool,
      `INSERT INTO categories (id, name, icon, color, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), color = VALUES(color)`,
      [result.insertId, name, icon || 'Tag', color || '#3B82F6', type || 'expense', now]
    );

    res.json({
      success: true,
      category: {
        id: result.insertId,
        name,
        icon: icon || 'Tag',
        color: color || '#3B82F6',
        type: type || 'expense',
        created_at: now,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, icon, color, type } = req.body;
    const pool = getDbPool();

    const [rows] = await pool.query<any[]>('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const curr = rows[0];

    const updateSql = `UPDATE categories 
       SET name = ?, icon = ?, color = ?, type = ?
       WHERE id = ?`;
    const updateParams = [
      name !== undefined ? name : curr.name,
      icon !== undefined ? icon : curr.icon,
      color !== undefined ? color : curr.color,
      type !== undefined ? type : curr.type,
      id,
    ];

    await pool.query(updateSql, updateParams);
    await mirrorQuery(pool, updateSql, updateParams);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = getDbPool();
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    await mirrorQuery(pool, 'DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. User Currency Update
app.patch('/api/user/currency', async (req, res) => {
  try {
    const { userId, currency } = req.body;
    const pool = getDbPool();
    await pool.query('UPDATE users SET currency = ? WHERE id = ?', [currency, Number(userId)]);
    await mirrorQuery(pool, 'UPDATE users SET currency = ? WHERE id = ?', [currency, Number(userId)]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. User Profile Update
app.put('/api/user/profile', async (req, res) => {
  try {
    const { id, first_name, last_name, username, email, currency } = req.body;
    const userId = Number(id);
    if (!userId || !first_name || !username || !email) {
      return res.status(400).json({ success: false, message: 'First name, username and email are required.' });
    }

    const pool = getDbPool();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Check if email or username already taken by another user
    const [existing] = await pool.query<any[]>(
      'SELECT id, username, email FROM users WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND id != ? LIMIT 1',
      [cleanEmail, cleanUsername, userId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'This email or username is already taken by another account.' });
    }

    const updateSql = 'UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ?, currency = ? WHERE id = ?';
    const updateParams = [first_name.trim(), (last_name || '').trim(), cleanUsername, cleanEmail, currency || 'USD', userId];

    await pool.query(updateSql, updateParams);
    await mirrorQuery(pool, updateSql, updateParams);

    const updatedUser = {
      id: userId,
      first_name: first_name.trim(),
      last_name: (last_name || '').trim(),
      username: cleanUsername,
      email: cleanEmail,
      currency: currency || 'USD',
    };

    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully!' });
  } catch (error: any) {
    console.error('[Update Profile Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13. Change Password for authenticated user
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const pool = getDbPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [Number(userId)]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const user = rows[0];
    const saltedHash = crypto.createHash('sha256').update(currentPassword + '_ebt_salt_sec_2026').digest('hex');
    const rawHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
    const validPasswords = [currentPassword, saltedHash, rawHash, `hash_${currentPassword}`];

    if (!validPasswords.includes(user.password)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect. Please check and try again.' });
    }

    const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
    await pool.query(updateSql, [newPassword, Number(userId)]);
    await mirrorQuery(pool, updateSql, [newPassword, Number(userId)]);

    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error: any) {
    console.error('[Change Password Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 14. Reset Data
app.post('/api/reset-data', async (req, res) => {
  try {
    await seedInitialData();
    res.json({ success: true, message: 'Database reset and sample data seeded successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend: Vite middleware in dev, static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: Number(PORT) },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
