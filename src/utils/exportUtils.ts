import { Category, Expense, Income, Budget, SavingsGoal, User } from '../types';
import { formatCurrency } from './formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportExpensesToCSV(
  expenses: Expense[],
  categories: Category[],
  user: User
) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const headers = ['ID', 'Date', 'Description', 'Category', `Amount (${user.currency})`, 'Payment Method', 'Is Recurring', 'Notes'];
  const rows = expenses.map(e => [
    e.id,
    e.date,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    `"${categoryMap.get(e.category_id) || 'Uncategorized'}"`,
    e.amount.toFixed(2),
    `"${e.payment_method}"`,
    e.is_recurring ? 'Yes' : 'No',
    `"${(e.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `Expenses_Report_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportFinancialSummaryToCSV(
  user: User,
  month: number,
  year: number,
  incomes: Income[],
  expenses: Expense[],
  budgets: Budget[],
  categories: Category[]
) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';

  let csv = `EXPENSE & BUDGET TRACKER - FINANCIAL REPORT\n`;
  csv += `User: ${user.first_name} ${user.last_name} (${user.email})\n`;
  csv += `Period: Month ${month}, ${year}\n`;
  csv += `Currency: ${user.currency}\n\n`;

  csv += `SUMMARY KPI\n`;
  csv += `Total Income,${totalIncome.toFixed(2)}\n`;
  csv += `Total Expenses,${totalExpense.toFixed(2)}\n`;
  csv += `Net Savings,${netSavings.toFixed(2)}\n`;
  csv += `Savings Rate,${savingsRate}%\n\n`;

  csv += `BUDGET PERFORMANCE\n`;
  csv += `Category,Budget Allocated,Spent Amount,Remaining,Status\n`;
  budgets.forEach(b => {
    const catName = categoryMap.get(b.category_id) || 'Unknown';
    const spent = expenses
      .filter(e => e.category_id === b.category_id)
      .reduce((sum, e) => sum + e.amount, 0);
    const rem = b.amount - spent;
    const status = spent > b.amount ? 'EXCEEDED' : spent >= b.amount * 0.85 ? 'WARNING' : 'ON TRACK';
    csv += `"${catName}",${b.amount.toFixed(2)},${spent.toFixed(2)},${rem.toFixed(2)},${status}\n`;
  });

  csv += `\nDETAILED EXPENSES\n`;
  csv += `Date,Description,Category,Amount,Payment Method\n`;
  expenses.forEach(e => {
    csv += `${e.date},"${(e.description || '').replace(/"/g, '""')}","${categoryMap.get(e.category_id) || ''}",${e.amount.toFixed(2)},"${e.payment_method}"\n`;
  });

  downloadFile(csv, `Financial_Statement_${year}_M${month}.csv`, 'text/csv;charset=utf-8;');
}

export function exportFinancialReportToPDF(
  user: User,
  periodType: 'monthly' | 'yearly',
  month: number,
  year: number,
  incomes: Income[],
  expenses: Expense[],
  budgets: Budget[],
  categories: Category[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const periodLabel = periodType === 'monthly' ? `${monthNames[month - 1]} ${year}` : `Full Year ${year}`;
  
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';

  // Primary Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  // Title
  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense & Budget Tracker', 14, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Financial Audit & Statement Report', 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 29);
  doc.text(`Period: ${periodLabel}`, 140, 29);

  // User details block
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 40, 182, 22, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 40, 182, 22, 3, 3, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT HOLDER:', 18, 48);
  doc.text('EMAIL ADDRESS:', 18, 56);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${user.first_name} ${user.last_name} (@${user.username})`, 55, 48);
  doc.text(`${user.email}`, 55, 56);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CURRENCY:', 125, 48);
  doc.text('TRANSACTIONS:', 125, 56);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(user.currency, 160, 48);
  doc.text(`${incomes.length + expenses.length} records`, 160, 56);

  // Summary Metrics Table
  autoTable(doc, {
    startY: 66,
    theme: 'grid',
    head: [['Total Inflow (Income)', 'Total Outflow (Expenses)', 'Net Savings / Surplus', 'Savings Rate']],
    body: [
      [
        `${user.currency} ${totalIncome.toFixed(2)}`,
        `${user.currency} ${totalExpense.toFixed(2)}`,
        `${user.currency} ${netSavings.toFixed(2)}`,
        `${savingsRate}%`
      ]
    ],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      halign: 'center',
      fontSize: 10,
      fontStyle: 'bold',
      textColor: [15, 23, 42]
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // Category Breakdown
  const catSpend: Record<number, number> = {};
  expenses.forEach(e => {
    catSpend[e.category_id] = (catSpend[e.category_id] || 0) + e.amount;
  });
  const catRows = Object.entries(catSpend)
    .map(([id, amt]) => {
      const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : '0';
      return [
        categoryMap.get(Number(id)) || 'Uncategorized',
        `${user.currency} ${amt.toFixed(2)}`,
        `${pct}%`
      ];
    })
    .sort((a, b) => parseFloat(b[1].replace(/[^0-9.]/g, '')) - parseFloat(a[1].replace(/[^0-9.]/g, '')));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Expense Category Breakdown', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    theme: 'striped',
    head: [['Category', 'Total Spent', '% of Total Spending']],
    body: catRows.length > 0 ? catRows : [['No expenses recorded in period', `${user.currency} 0.00`, '0%']],
    headStyles: { fillColor: [244, 63, 94] }, // rose-500
    styles: { fontSize: 9 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Budget Compliance if any
  if (budgets.length > 0) {
    if (currentY > 225) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Monthly Budget Adherence & Limits', 14, currentY);

    const budgetRows = budgets.map(b => {
      const spent = expenses
        .filter(e => e.category_id === b.category_id)
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = b.amount - spent;
      const status = spent > b.amount ? 'EXCEEDED' : spent >= b.amount * 0.85 ? 'WARNING' : 'ON TRACK';
      return [
        categoryMap.get(b.category_id) || 'Unknown',
        `${user.currency} ${b.amount.toFixed(2)}`,
        `${user.currency} ${spent.toFixed(2)}`,
        `${user.currency} ${remaining.toFixed(2)}`,
        status
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      theme: 'striped',
      head: [['Category', 'Monthly Cap', 'Actual Spent', 'Variance', 'Status']],
      body: budgetRows,
      headStyles: { fillColor: [217, 119, 6] }, // amber-600
      styles: { fontSize: 9 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Detailed Transactions Table
  if (currentY > 215) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Detailed Expenses Log', 14, currentY);

  const txRows = expenses.slice(0, 100).map(e => [
    e.date.slice(0, 10),
    e.description || 'Expense',
    categoryMap.get(e.category_id) || 'General',
    e.payment_method || 'Cash',
    `${user.currency} ${e.amount.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    theme: 'striped',
    head: [['Date', 'Description / Payee', 'Category', 'Payment Mode', 'Amount']],
    body: txRows.length > 0 ? txRows : [['-', 'No expenses in this period', '-', '-', `${user.currency} 0.00`]],
    headStyles: { fillColor: [71, 85, 105] }, // slate-600
    styles: { fontSize: 8 }
  });

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Expense & Budget Tracker Audit Statement - Confidential - Page ${i} of ${totalPages}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const cleanPeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Financial_Statement_${cleanPeriod}_${user.username}.pdf`;
  doc.save(filename);
}

export function generateMySQLDump(
  user: User,
  categories: Category[],
  expenses: Expense[],
  incomes: Income[],
  budgets: Budget[],
  goals: SavingsGoal[]
): string {
  return `-- ==========================================================
-- Data Alcott Systems - Virtual Python Full Stack Internship
-- Task ID: PY-FN-002
-- Task Name: Expense & Budget Tracker
-- Database: MySQL 8.x (Relational Schema Dump)
-- Generated on: ${new Date().toISOString()}
-- ==========================================================

CREATE DATABASE IF NOT EXISTS budget_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE budget_db;

-- ----------------------------------------------------------
-- 1. Table structure for table 'user'
-- ----------------------------------------------------------
DROP TABLE IF EXISTS financial_report;
DROP TABLE IF EXISTS recurring_expense;
DROP TABLE IF EXISTS savings_goal;
DROP TABLE IF EXISTS budget;
DROP TABLE IF EXISTS income;
DROP TABLE IF EXISTS expense;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS user;

CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 2. Table structure for table 'category'
-- ----------------------------------------------------------
CREATE TABLE category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'fa-tag',
    color VARCHAR(7) DEFAULT '#F59E0B',
    type VARCHAR(20) DEFAULT 'expense',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 3. Table structure for table 'expense'
-- ----------------------------------------------------------
CREATE TABLE expense (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(200),
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_period VARCHAR(20),
    payment_method VARCHAR(50),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 4. Table structure for table 'income'
-- ----------------------------------------------------------
CREATE TABLE income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    source VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_period VARCHAR(20),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 5. Table structure for table 'budget'
-- ----------------------------------------------------------
CREATE TABLE budget (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    spent DECIMAL(10,2) DEFAULT 0.00,
    month INT NOT NULL,
    year INT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 6. Table structure for table 'savings_goal'
-- ----------------------------------------------------------
CREATE TABLE savings_goal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    saved_amount DECIMAL(10,2) DEFAULT 0.00,
    target_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 7. Table structure for table 'recurring_expense'
-- ----------------------------------------------------------
CREATE TABLE recurring_expense (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(200),
    frequency VARCHAR(20) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- 8. Table structure for table 'financial_report'
-- ----------------------------------------------------------
CREATE TABLE financial_report (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type VARCHAR(20) NOT NULL,
    month INT,
    year INT,
    total_income DECIMAL(10,2) DEFAULT 0.00,
    total_expenses DECIMAL(10,2) DEFAULT 0.00,
    savings DECIMAL(10,2) DEFAULT 0.00,
    report_data JSON,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- DUMPING DATA
-- ----------------------------------------------------------
INSERT INTO user (id, username, email, password, first_name, last_name, currency, created_at)
VALUES (${user.id}, '${user.username}', '${user.email}', '$2b$12$e8Y6Pqj3G...', '${user.first_name}', '${user.last_name}', '${user.currency}', NOW());

${categories.map(c => 
  `INSERT INTO category (id, name, icon, color, type) VALUES (${c.id}, '${c.name.replace(/'/g, "''")}', '${c.icon}', '${c.color}', '${c.type}');`
).join('\n')}

${expenses.map(e => 
  `INSERT INTO expense (id, user_id, category_id, amount, description, date, is_recurring, payment_method, notes) VALUES (${e.id}, ${e.user_id}, ${e.category_id}, ${e.amount}, '${(e.description||'').replace(/'/g, "''")}', '${e.date} 12:00:00', ${e.is_recurring ? 1 : 0}, '${e.payment_method}', '${(e.notes||'').replace(/'/g, "''")}');`
).join('\n')}

${incomes.map(i => 
  `INSERT INTO income (id, user_id, source, amount, date, is_recurring, notes) VALUES (${i.id}, ${i.user_id}, '${i.source.replace(/'/g, "''")}', ${i.amount}, '${i.date}', ${i.is_recurring ? 1 : 0}, '${(i.notes||'').replace(/'/g, "''")}');`
).join('\n')}

${budgets.map(b => 
  `INSERT INTO budget (id, user_id, category_id, amount, month, year, notes) VALUES (${b.id}, ${b.user_id}, ${b.category_id}, ${b.amount}, ${b.month}, ${b.year}, '${(b.notes||'').replace(/'/g, "''")}');`
).join('\n')}

${goals.map(g => 
  `INSERT INTO savings_goal (id, user_id, name, target_amount, saved_amount, target_date, is_completed, notes) VALUES (${g.id}, ${g.user_id}, '${g.name.replace(/'/g, "''")}', ${g.target_amount}, ${g.saved_amount}, '${g.target_date}', ${g.is_completed ? 1 : 0}, '${(g.notes||'').replace(/'/g, "''")}');`
).join('\n')}

-- End of Database Dump
`;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
