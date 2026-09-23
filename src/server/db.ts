import mysql, { Pool } from 'mysql2/promise';

const DEFAULT_DB_URL = 'mysql://3AfWrYmrU3kFNtZ.root:lpC5GK4wwlyx64tx@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/expense_tracker';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const uri = process.env.DATABASE_URL || DEFAULT_DB_URL;
    pool = mysql.createPool({
      uri,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const rawPool = getDbPool();
    
    // Ensure database and tables exist
    await rawPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(150) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        password VARCHAR(255) NOT NULL,
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await rawPool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        color VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL,
        created_at VARCHAR(64) NOT NULL
      );
    `);

    await rawPool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        description VARCHAR(255) NOT NULL,
        date VARCHAR(32) NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_period VARCHAR(50),
        payment_method VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at VARCHAR(64) NOT NULL,
        updated_at VARCHAR(64) NOT NULL
      );
    `);

    await rawPool.query(`
      CREATE TABLE IF NOT EXISTS incomes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        source VARCHAR(150) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        date VARCHAR(32) NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_period VARCHAR(50),
        notes TEXT,
        created_at VARCHAR(64) NOT NULL,
        updated_at VARCHAR(64) NOT NULL
      );
    `);

    await rawPool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        notes TEXT,
        created_at VARCHAR(64) NOT NULL,
        updated_at VARCHAR(64) NOT NULL
      );
    `);

    await rawPool.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        target_amount DECIMAL(12,2) NOT NULL,
        saved_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        target_date VARCHAR(32) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at VARCHAR(64) NOT NULL,
        updated_at VARCHAR(64) NOT NULL
      );
    `);

    // Check if initial user exists
    const [userRows] = await rawPool.query('SELECT id FROM users LIMIT 1');
    if (Array.isArray(userRows) && userRows.length === 0) {
      await seedInitialData();
    }

    return { success: true, message: 'Database initialized successfully with TiDB Cloud!' };
  } catch (error: any) {
    console.error('Failed to initialize database:', error);
    return { success: false, message: error.message };
  }
}

export async function seedInitialData(): Promise<void> {
  const p = getDbPool();
  const now = new Date().toISOString();
  const today = new Date();
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const makeDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

  // 1. Insert primary user
  await p.query(`
    INSERT INTO users (id, username, email, first_name, last_name, currency, password, created_at)
    VALUES (1, 'ramyaselva', 'ramyaselva048@gmail.com', 'Ramya', 'Selva', 'USD', 'Password@123', ?)
    ON DUPLICATE KEY UPDATE username=username;
  `, [now]);

  // 2. Insert standard categories
  const categories = [
    [1, 'Housing & Rent', 'Home', '#3B82F6', 'expense'],
    [2, 'Groceries & Food', 'ShoppingCart', '#10B981', 'expense'],
    [3, 'Dining Out & Cafe', 'Utensils', '#F59E0B', 'expense'],
    [4, 'Transportation', 'Car', '#8B5CF6', 'expense'],
    [5, 'Utilities & Bills', 'Zap', '#EC4899', 'expense'],
    [6, 'Entertainment & Subs', 'Tv', '#6366F1', 'expense'],
    [7, 'Healthcare & Fitness', 'HeartPulse', '#EF4444', 'expense'],
    [8, 'Shopping & Apparel', 'ShoppingBag', '#14B8A6', 'expense'],
    [9, 'Education & Courses', 'GraduationCap', '#0EA5E9', 'expense'],
    [10, 'Travel & Vacation', 'Plane', '#F97316', 'expense'],
    [11, 'Monthly Salary', 'Briefcase', '#059669', 'income'],
    [12, 'Freelance & Projects', 'Code', '#2563EB', 'income'],
    [13, 'Investment Returns', 'TrendingUp', '#7C3AED', 'income'],
    [14, 'Bonus & Dividends', 'Award', '#D97706', 'income'],
  ];

  for (const [id, name, icon, color, type] of categories) {
    await p.query(`
      INSERT INTO categories (id, name, icon, color, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `, [id, name, icon, color, type, now]);
  }

  // 3. Insert expenses
  const sampleExpenses = [
    [1, 1, 1, 1200.00, 'Apartment Monthly Rent', makeDate(curYear, curMonth, 1), 1, 'monthly', 'Bank Transfer', 'Paid on 1st of month'],
    [2, 1, 2, 142.50, 'Weekly Organic Grocery Run', makeDate(curYear, curMonth, 3), 0, null, 'Credit Card', 'Whole Foods fresh produce'],
    [3, 1, 5, 85.00, 'High-speed Fiber Internet', makeDate(curYear, curMonth, 4), 1, 'monthly', 'Credit Card', '1 Gbps symmetrical connection'],
    [4, 1, 3, 48.20, 'Team Dinner & Tapas', makeDate(curYear, curMonth, 7), 0, null, 'Debit Card', 'Dinner with colleagues'],
    [5, 1, 4, 32.50, 'Metro Transit Pass Refill', makeDate(curYear, curMonth, 8), 0, null, 'Credit Card', 'Monthly subway card refill'],
    [6, 1, 6, 14.99, 'Music & Media Streaming', makeDate(curYear, curMonth, 10), 1, 'monthly', 'Credit Card', 'Monthly family subscription plan'],
    [7, 1, 2, 88.40, 'Trader Joe Pantry Stock', makeDate(curYear, curMonth, 11), 0, null, 'Credit Card', 'Snacks and baking goods'],
    [8, 1, 7, 65.00, 'Gym & Fitness Membership', makeDate(curYear, curMonth, 12), 1, 'monthly', 'Bank Transfer', 'Monthly unlimited access'],
    [9, 1, 8, 79.99, 'Ergonomic Desk Accessories', makeDate(curYear, curMonth, 14), 0, null, 'Credit Card', 'Memory foam wrist rest'],
    [10, 1, 3, 24.50, 'Artisan Coffee & Bakery', makeDate(curYear, curMonth, 16), 0, null, 'UPI', 'Weekend morning breakfast'],
    [11, 1, 4, 45.00, 'Fuel & Electric Charge', makeDate(curYear, curMonth, 18), 0, null, 'Credit Card', 'Weekly vehicle recharge'],
    [12, 1, 10, 210.00, 'Weekend Mountain Getaway', makeDate(curYear, curMonth, 20), 0, null, 'Credit Card', 'Cabin booking and fuel'],
  ];

  for (const exp of sampleExpenses) {
    await p.query(`
      INSERT INTO expenses (id, user_id, category_id, amount, description, date, is_recurring, recurrence_period, payment_method, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE amount=VALUES(amount);
    `, [...exp, now, now]);
  }

  // 4. Insert incomes
  const sampleIncomes = [
    [1, 1, 'Full-time Tech Salary', 3850.00, makeDate(curYear, curMonth, 1), 1, 'monthly', 'Direct deposit from employer'],
    [2, 1, 'Full Stack Web Consulting', 750.00, makeDate(curYear, curMonth, 12), 0, null, 'Dashboard UI & API integration milestone'],
    [3, 1, 'Index Fund Dividend', 165.00, makeDate(curYear, curMonth, 15), 0, null, 'Quarterly ETF dividend payout'],
  ];

  for (const inc of sampleIncomes) {
    await p.query(`
      INSERT INTO incomes (id, user_id, source, amount, date, is_recurring, recurrence_period, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE amount=VALUES(amount);
    `, [...inc, now, now]);
  }

  // 5. Insert budgets
  const sampleBudgets = [
    [1, 1, 1, 1200.00, curMonth, curYear, 'Fixed apartment rent contract'],
    [2, 1, 2, 350.00, curMonth, curYear, 'Weekly fresh groceries budget'],
    [3, 1, 3, 150.00, curMonth, curYear, 'Limit coffee shops and restaurant outings'],
    [4, 1, 4, 120.00, curMonth, curYear, 'Public transport and fuel'],
    [5, 1, 5, 110.00, curMonth, curYear, 'Internet and electric utilities'],
    [6, 1, 8, 100.00, curMonth, curYear, 'Discretionary apparel and electronics'],
  ];

  for (const b of sampleBudgets) {
    await p.query(`
      INSERT INTO budgets (id, user_id, category_id, amount, month, year, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE amount=VALUES(amount);
    `, [...b, now, now]);
  }

  // 6. Insert savings goals
  const sampleGoals = [
    [1, 1, 'Emergency Fund (6 Months)', 10000.00, 7850.00, makeDate(curYear + 1, 3, 31), 0, 'High-yield savings account backup reserve'],
    [2, 1, 'Developer Laptop Upgrade', 2200.00, 2200.00, makeDate(curYear, curMonth, 1), 1, 'Fully funded workstation'],
    [3, 1, 'Tokyo Autumn Vacation', 3500.00, 1950.00, makeDate(curYear, 11, 15), 0, 'Accommodations and JR pass'],
    [4, 1, 'Apartment Down Payment', 25000.00, 9400.00, makeDate(curYear + 2, 6, 30), 0, 'Long term housing fund'],
  ];

  for (const g of sampleGoals) {
    await p.query(`
      INSERT INTO savings_goals (id, user_id, name, target_amount, saved_amount, target_date, is_completed, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE target_amount=VALUES(target_amount);
    `, [...g, now, now]);
  }

  console.log('Sample data seeded successfully into TiDB Cloud MySQL database!');
}
