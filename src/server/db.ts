import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const TIDB_USER_DATABASE_URL = 'mysql://3AfWrYmrU3kFNtZ.root:ZZZl6zxgReVFuEdJ@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/expense_tracker';
let rawUrl: string = process.env.DATABASE_URL || TIDB_USER_DATABASE_URL;

if (rawUrl.includes('username:password') || rawUrl.trim() === '') {
  rawUrl = TIDB_USER_DATABASE_URL;
}

function parseMysqlUrl(urlStr: string) {
  try {
    const match = urlStr.match(/^mysql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?(?:\/([^?]+))?/);
    if (match) {
      const [, user, password, host, portStr, rawDb] = match;
      const port = portStr ? parseInt(portStr, 10) : 4000;
      let database = rawDb || 'expense_tracker';
      // In TiDB Cloud, 'sys' is restricted, so fallback to expense_tracker
      if (database === 'sys' || !database) database = 'expense_tracker';
      return {
        host,
        port,
        user: decodeURIComponent(user),
        password: decodeURIComponent(password),
        database,
      };
    }
  } catch (e) {
    console.error('Error parsing DATABASE_URL:', e);
  }
  return {
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3AfWrYmrU3kFNtZ.root',
    password: 'ZZZl6zxgReVFuEdJ',
    database: 'expense_tracker',
  };
}

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const connParams = parseMysqlUrl(rawUrl);
    pool = mysql.createPool({
      host: connParams.host,
      port: connParams.port,
      user: connParams.user,
      password: connParams.password,
      database: connParams.database,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 5,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
    console.log(`[Database] MySQL connection pool created for TiDB Cloud (${connParams.host}:${connParams.port}/${connParams.database})`);
  }
  return pool;
}

export async function initDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDbPool();

    // 1. Verify connection
    await db.query('SELECT 1');

    // 2. Ensure expense_tracker database is created and selected
    const connParams = parseMysqlUrl(rawUrl);
    const targetDb = connParams.database || 'expense_tracker';
    await db.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\``);
    await db.query(`USE \`${targetDb}\``);

    // 3. Also ensure test database exists for dual-schema mirroring
    try {
      await db.query('CREATE DATABASE IF NOT EXISTS `test`');
    } catch (e) {
      console.warn('Notice creating test db:', e);
    }

    const tableDefs = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`username\` VARCHAR(100) NOT NULL UNIQUE,
          \`email\` VARCHAR(150) NOT NULL UNIQUE,
          \`first_name\` VARCHAR(100) NOT NULL,
          \`last_name\` VARCHAR(100) NOT NULL,
          \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
          \`password\` VARCHAR(255) NOT NULL,
          \`created_at\` VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;`
      },
      {
        name: 'categories',
        sql: `CREATE TABLE IF NOT EXISTS \`categories\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(100) NOT NULL,
          \`icon\` VARCHAR(50) NOT NULL,
          \`color\` VARCHAR(50) NOT NULL,
          \`type\` VARCHAR(20) NOT NULL,
          \`created_at\` VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;`
      },
      {
        name: 'expenses',
        sql: `CREATE TABLE IF NOT EXISTS \`expenses\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`user_id\` INT NOT NULL,
          \`category_id\` INT NOT NULL,
          \`amount\` DECIMAL(12, 2) NOT NULL,
          \`description\` VARCHAR(255) NOT NULL,
          \`date\` VARCHAR(32) NOT NULL,
          \`is_recurring\` TINYINT(1) DEFAULT 0,
          \`recurrence_period\` VARCHAR(50) DEFAULT NULL,
          \`payment_method\` VARCHAR(50) NOT NULL,
          \`notes\` TEXT DEFAULT NULL,
          \`created_at\` VARCHAR(64) NOT NULL,
          \`updated_at\` VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;`
      },
      {
        name: 'incomes',
        sql: `CREATE TABLE IF NOT EXISTS \`incomes\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`user_id\` INT NOT NULL,
          \`source\` VARCHAR(150) NOT NULL,
          \`amount\` DECIMAL(12, 2) NOT NULL,
          \`date\` VARCHAR(32) NOT NULL,
          \`is_recurring\` TINYINT(1) DEFAULT 0,
          \`recurrence_period\` VARCHAR(50) DEFAULT NULL,
          \`notes\` TEXT DEFAULT NULL,
          \`created_at\` VARCHAR(64) NOT NULL,
          \`updated_at\` VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;`
      },
      {
        name: 'budgets',
        sql: `CREATE TABLE IF NOT EXISTS \`budgets\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`user_id\` INT NOT NULL,
          \`category_id\` INT NOT NULL,
          \`amount\` DECIMAL(12, 2) NOT NULL,
          \`month\` INT NOT NULL,
          \`year\` INT NOT NULL,
          \`notes\` TEXT DEFAULT NULL,
          \`created_at\` VARCHAR(64) NOT NULL,
          \`updated_at\` VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;`
      },
      {
        name: 'savings_goals',
        sql: `CREATE TABLE IF NOT EXISTS \`savings_goals\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`user_id\` INT NOT NULL,
          \`name\` VARCHAR(150) NOT NULL,
          \`target_amount\` DECIMAL(12, 2) NOT NULL,
          \`saved_amount\` DECIMAL(12, 2) NOT NULL DEFAULT 0,
          \`target_date\` VARCHAR(32) NOT NULL,
          \`is_completed\` TINYINT(1) DEFAULT 0,
          \`notes\` TEXT DEFAULT NULL,
          \`created_at\` VARCHAR(64) NOT NULL,
          \`updated_at\` VARCHAR(64) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;`
      }
    ];

    // Create in active target schema
    for (const t of tableDefs) {
      await db.query(t.sql);
    }

    // Mirror tables in test schema
    for (const t of tableDefs) {
      try {
        const mirrorSql = t.sql.replace('CREATE TABLE IF NOT EXISTS `' + t.name + '`', 'CREATE TABLE IF NOT EXISTS `test`.`' + t.name + '`');
        await db.query(mirrorSql);
      } catch (e) {
        // ignore
      }
    }

    // Ensure default users exist in TiDB Cloud
    await ensureDefaultUsers(db);

    // 4. Check if categories need seeding in primary database
    const [catRows] = await db.query<any[]>('SELECT COUNT(*) as count FROM `categories`');
    const catCount = Array.isArray(catRows) && catRows[0] ? Number(catRows[0].count) : 0;

    if (catCount === 0) {
      await seedInitialData();
      return { success: true, message: `Connected to TiDB Cloud (${targetDb} schema) and seeded initial records.` };
    }

    return { success: true, message: `Connected to TiDB Cloud (${targetDb} schema) successfully!` };
  } catch (error: any) {
    console.error('[Database Init Failed]', error);
    return { success: false, message: `Database connection failed: ${error.message}` };
  }
}

async function ensureDefaultUsers(db: any): Promise<void> {
  const now = new Date().toISOString();
  const defaultAccounts = [
    { username: 'ramyaselva', email: 'ramyaselva048@gmail.com', first_name: 'Ramya', last_name: 'Selva', currency: 'USD', password: 'Password@123' },
    { username: 'iswaryai', email: 'iswaryai078@gmail.com', first_name: 'Iswarya', last_name: 'I', currency: 'USD', password: 'Password@123' },
  ];

  for (const acc of defaultAccounts) {
    try {
      const [rows]: any = await db.query('SELECT id FROM `users` WHERE LOWER(email) = ? OR LOWER(username) = ?', [acc.email.toLowerCase(), acc.username.toLowerCase()]);
      if (!Array.isArray(rows) || rows.length === 0) {
        await db.query(
          'INSERT INTO `users` (username, email, first_name, last_name, currency, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [acc.username, acc.email, acc.first_name, acc.last_name, acc.currency, acc.password, now]
        );
      }
    } catch (e) {
      // Ignore if table not yet ready or duplicate
    }
  }
}

export async function seedInitialData(): Promise<void> {
  const db = getDbPool();
  const now = new Date().toISOString();
  const today = new Date();
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const makeDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

  console.log('[Database] Seeding initial data into TiDB Cloud...');

  // Seed default users if not exists
  const [userRows] = await db.query<any[]>('SELECT id FROM `users` WHERE email = ?', ['ramyaselva048@gmail.com']);
  let userId = 1;
  if (!Array.isArray(userRows) || userRows.length === 0) {
    const [res] = await db.query<any>(
      'INSERT INTO `users` (username, email, first_name, last_name, currency, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['ramyaselva', 'ramyaselva048@gmail.com', 'Ramya', 'Selva', 'USD', 'Password@123', now]
    );
    userId = res.insertId || 1;
  } else {
    userId = userRows[0].id;
  }

  const [iswaryaRows] = await db.query<any[]>('SELECT id FROM `users` WHERE email = ?', ['iswaryai078@gmail.com']);
  if (!Array.isArray(iswaryaRows) || iswaryaRows.length === 0) {
    await db.query<any>(
      'INSERT INTO `users` (username, email, first_name, last_name, currency, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['iswaryai', 'iswaryai078@gmail.com', 'Iswarya', 'I', 'USD', 'Password@123', now]
    );
  }

  // Seed categories
  const categoriesToSeed = [
    { name: 'Housing & Rent', icon: 'Home', color: '#3B82F6', type: 'expense' },
    { name: 'Groceries & Food', icon: 'ShoppingCart', color: '#10B981', type: 'expense' },
    { name: 'Dining Out & Cafe', icon: 'Utensils', color: '#F59E0B', type: 'expense' },
    { name: 'Transportation', icon: 'Car', color: '#8B5CF6', type: 'expense' },
    { name: 'Utilities & Bills', icon: 'Zap', color: '#EC4899', type: 'expense' },
    { name: 'Entertainment & Subs', icon: 'Tv', color: '#6366F1', type: 'expense' },
    { name: 'Healthcare & Fitness', icon: 'HeartPulse', color: '#EF4444', type: 'expense' },
    { name: 'Shopping & Apparel', icon: 'ShoppingBag', color: '#14B8A6', type: 'expense' },
    { name: 'Education & Courses', icon: 'GraduationCap', color: '#0EA5E9', type: 'expense' },
    { name: 'Travel & Vacation', icon: 'Plane', color: '#F97316', type: 'expense' },
    { name: 'Monthly Salary', icon: 'Briefcase', color: '#059669', type: 'income' },
    { name: 'Freelance & Projects', icon: 'Code', color: '#2563EB', type: 'income' },
    { name: 'Investment Returns', icon: 'TrendingUp', color: '#7C3AED', type: 'income' },
    { name: 'Bonus & Dividends', icon: 'Award', color: '#D97706', type: 'income' },
  ];

  for (const cat of categoriesToSeed) {
    const [existing] = await db.query<any[]>('SELECT id FROM `categories` WHERE name = ?', [cat.name]);
    if (!Array.isArray(existing) || existing.length === 0) {
      await db.query(
        'INSERT INTO `categories` (name, icon, color, type, created_at) VALUES (?, ?, ?, ?, ?)',
        [cat.name, cat.icon, cat.color, cat.type, now]
      );
    }
  }

  // Get categories mapping for foreign keys
  const [allCats] = await db.query<any[]>('SELECT id, name FROM `categories`');
  const catMap = new Map<string, number>();
  if (Array.isArray(allCats)) {
    allCats.forEach((c) => catMap.set(c.name, c.id));
  }

  const housingId = catMap.get('Housing & Rent') || 1;
  const groceryId = catMap.get('Groceries & Food') || 2;
  const diningId = catMap.get('Dining Out & Cafe') || 3;
  const transportId = catMap.get('Transportation') || 4;
  const utilitiesId = catMap.get('Utilities & Bills') || 5;
  const entertainmentId = catMap.get('Entertainment & Subs') || 6;
  const healthId = catMap.get('Healthcare & Fitness') || 7;
  const shoppingId = catMap.get('Shopping & Apparel') || 8;
  const travelId = catMap.get('Travel & Vacation') || 10;

  // Seed expenses if empty
  const [expRows] = await db.query<any[]>('SELECT COUNT(*) as count FROM `expenses` WHERE user_id = ?', [userId]);
  if (Array.isArray(expRows) && Number(expRows[0]?.count) === 0) {
    const expensesToSeed = [
      [userId, housingId, 1200.0, 'Apartment Monthly Rent', makeDate(curYear, curMonth, 1), 1, 'monthly', 'Bank Transfer', 'Paid on 1st of month', now, now],
      [userId, groceryId, 142.5, 'Weekly Organic Grocery Run', makeDate(curYear, curMonth, 3), 0, null, 'Credit Card', 'Whole Foods fresh produce', now, now],
      [userId, utilitiesId, 85.0, 'High-speed Fiber Internet', makeDate(curYear, curMonth, 4), 1, 'monthly', 'Credit Card', '1 Gbps symmetrical connection', now, now],
      [userId, diningId, 48.2, 'Team Dinner & Tapas', makeDate(curYear, curMonth, 7), 0, null, 'Debit Card', 'Dinner with colleagues', now, now],
      [userId, transportId, 32.5, 'Metro Transit Pass Refill', makeDate(curYear, curMonth, 8), 0, null, 'Credit Card', 'Monthly subway card refill', now, now],
      [userId, entertainmentId, 14.99, 'Music & Media Streaming', makeDate(curYear, curMonth, 10), 1, 'monthly', 'Credit Card', 'Monthly family subscription plan', now, now],
      [userId, groceryId, 88.4, 'Trader Joe Pantry Stock', makeDate(curYear, curMonth, 11), 0, null, 'Credit Card', 'Snacks and baking goods', now, now],
      [userId, healthId, 65.0, 'Gym & Fitness Membership', makeDate(curYear, curMonth, 12), 1, 'monthly', 'Bank Transfer', 'Monthly gym access', now, now],
      [userId, shoppingId, 79.99, 'Ergonomic Desk Accessories', makeDate(curYear, curMonth, 14), 0, null, 'Credit Card', 'Memory foam wrist rest', now, now],
      [userId, diningId, 24.5, 'Artisan Coffee & Bakery', makeDate(curYear, curMonth, 16), 0, null, 'UPI', 'Weekend morning breakfast', now, now],
      [userId, transportId, 45.0, 'Fuel & Electric Charge', makeDate(curYear, curMonth, 18), 0, null, 'Credit Card', 'Weekly vehicle charge', now, now],
      [userId, travelId, 210.0, 'Weekend Mountain Getaway', makeDate(curYear, curMonth, 20), 0, null, 'Credit Card', 'Cabin booking and fuel', now, now],
    ];

    for (const exp of expensesToSeed) {
      await db.query(
        'INSERT INTO `expenses` (user_id, category_id, amount, description, date, is_recurring, recurrence_period, payment_method, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        exp
      );
    }
  }

  // Seed incomes if empty
  const [incRows] = await db.query<any[]>('SELECT COUNT(*) as count FROM `incomes` WHERE user_id = ?', [userId]);
  if (Array.isArray(incRows) && Number(incRows[0]?.count) === 0) {
    const incomesToSeed = [
      [userId, 'Full-time Tech Salary', 3850.0, makeDate(curYear, curMonth, 1), 1, 'monthly', 'Direct deposit from employer', now, now],
      [userId, 'Full Stack Web Consulting', 750.0, makeDate(curYear, curMonth, 12), 0, null, 'Dashboard UI & API integration milestone', now, now],
      [userId, 'Index Fund Dividend', 165.0, makeDate(curYear, curMonth, 15), 0, null, 'Quarterly ETF dividend payout', now, now],
    ];
    for (const inc of incomesToSeed) {
      await db.query(
        'INSERT INTO `incomes` (user_id, source, amount, date, is_recurring, recurrence_period, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        inc
      );
    }
  }

  // Seed budgets if empty
  const [budgetRows] = await db.query<any[]>('SELECT COUNT(*) as count FROM `budgets` WHERE user_id = ? AND month = ? AND year = ?', [userId, curMonth, curYear]);
  if (Array.isArray(budgetRows) && Number(budgetRows[0]?.count) === 0) {
    const budgetsToSeed = [
      [userId, housingId, 1200.0, curMonth, curYear, 'Fixed apartment rent contract', now, now],
      [userId, groceryId, 350.0, curMonth, curYear, 'Weekly fresh groceries budget', now, now],
      [userId, diningId, 150.0, curMonth, curYear, 'Limit coffee shops and restaurant outings', now, now],
      [userId, transportId, 120.0, curMonth, curYear, 'Public transport and fuel', now, now],
      [userId, utilitiesId, 110.0, curMonth, curYear, 'Internet and electric utilities', now, now],
      [userId, shoppingId, 100.0, curMonth, curYear, 'Discretionary apparel and electronics', now, now],
    ];
    for (const b of budgetsToSeed) {
      await db.query(
        'INSERT INTO `budgets` (user_id, category_id, amount, month, year, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        b
      );
    }
  }

  // Seed savings goals if empty
  const [goalRows] = await db.query<any[]>('SELECT COUNT(*) as count FROM `savings_goals` WHERE user_id = ?', [userId]);
  if (Array.isArray(goalRows) && Number(goalRows[0]?.count) === 0) {
    const goalsToSeed = [
      [userId, 'Emergency Fund (6 Months)', 10000.0, 7850.0, makeDate(curYear + 1, 3, 31), 0, 'High-yield savings account backup reserve', now, now],
      [userId, 'Developer Laptop Upgrade', 2200.0, 2200.0, makeDate(curYear, curMonth, 1), 1, 'Fully funded workstation', now, now],
      [userId, 'Tokyo Autumn Vacation', 3500.0, 1950.0, makeDate(curYear, 11, 15), 0, 'Accommodations and JR pass', now, now],
      [userId, 'Apartment Down Payment', 25000.0, 9400.0, makeDate(curYear + 2, 6, 30), 0, 'Long term housing fund', now, now],
    ];
    for (const g of goalsToSeed) {
      await db.query(
        'INSERT INTO `savings_goals` (user_id, name, target_amount, saved_amount, target_date, is_completed, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        g
      );
    }
  }

  console.log('[Database] Seed completed successfully!');
}
