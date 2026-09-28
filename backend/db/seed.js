/**
 * Seeds the database with a default admin user and sample sales/finance data.
 * Run with: npm run seed   (after schema.sql has been applied)
 */
require('dotenv').config();
const pool = require('../src/config/db');

const ADMIN_EMAIL = 'admin@ay-dashboard.local';
// Password: admin123  (change it after first login)
const ADMIN_PASSWORD_HASH = '$2b$10$FfGSByoH2QbslxQQzpmYkuZ5M.Iu4rs9mNZHixKteS6mPUaykF0CK';

const customers = [
  ['شرکت آریان تجارت', 'info@ariantejarat.ir', '021-88451200', 'آریان تجارت'],
  ['فروشگاه زرین‌کالا', 'sales@zarinkala.ir', '021-77123400', 'زرین‌کالا'],
  ['گروه صنعتی البرز', 'contact@alborzgroup.ir', '026-32654200', 'صنعتی البرز'],
  ['استودیو طراحی مانا', 'hello@manastudio.ir', '021-22334455', 'استودیو مانا'],
  ['بازرگانی خلیج فارس', 'info@pgtrading.ir', '071-33221100', 'بازرگانی خلیج فارس'],
];

const categories = ['اشتراک نرم‌افزار', 'فروش محصول', 'خدمات مشاوره', 'اجاره دفتر', 'حقوق و دستمزد', 'تبلیغات'];

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().slice(0, 10);
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('در حال درج کاربر مدیر...');
    await client.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name`,
      ['مدیر سیستم', ADMIN_EMAIL, ADMIN_PASSWORD_HASH]
    );

    console.log('در حال درج مشتریان نمونه...');
    const customerIds = [];
    for (const [name, email, phone, company] of customers) {
      const result = await client.query(
        `INSERT INTO customers (name, email, phone, company) VALUES ($1, $2, $3, $4) RETURNING id`,
        [name, email, phone, company]
      );
      customerIds.push(result.rows[0].id);
    }

    console.log('در حال درج فاکتورهای نمونه...');
    const statuses = ['paid', 'paid', 'pending', 'overdue'];
    for (let i = 1; i <= 24; i++) {
      const custId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const amount = (Math.random() * 45000000 + 2000000).toFixed(2);
      const issue = randomDate(90);
      await client.query(
        `INSERT INTO invoices (invoice_no, customer_id, amount, status, issue_date, due_date)
         VALUES ($1, $2, $3, $4, $5, ($5::date + INTERVAL '14 days'))`,
        [`INV-${1000 + i}`, custId, amount, statuses[Math.floor(Math.random() * statuses.length)], issue]
      );
    }

    console.log('در حال درج تراکنش‌های نمونه...');
    for (let i = 0; i < 60; i++) {
      const isIncome = Math.random() > 0.35;
      const amount = (Math.random() * 20000000 + 500000).toFixed(2);
      const custId = isIncome ? customerIds[Math.floor(Math.random() * customerIds.length)] : null;
      await client.query(
        `INSERT INTO transactions (type, category, amount, customer_id, description, txn_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          isIncome ? 'income' : 'expense',
          categories[Math.floor(Math.random() * categories.length)],
          amount,
          custId,
          isIncome ? 'دریافت وجه از مشتری' : 'هزینه عملیاتی',
          randomDate(120),
        ]
      );
    }

    console.log('✅ داده‌های نمونه با موفقیت درج شد.');
    console.log(`ورود با ایمیل: ${ADMIN_EMAIL}  |  رمز عبور: admin123`);
  } catch (err) {
    console.error('❌ خطا در seed کردن دیتابیس:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();