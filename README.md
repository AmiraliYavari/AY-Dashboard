# AY-Dashboard

داشبورد مدیریتی فروش و مالی — **کاملاً TypeScript**
بک‌اند: Node.js + Express + PostgreSQL (در Docker) | فرانت‌اند: React + Vite
فونت‌ها: Vazirmatn (متن) و Lalezar (اعداد و عناوین) | آیکون‌ها: Google Material Symbols

## ساختار پروژه

```
AY-Dashboard/
├── docker-compose.yml       # دیتابیس PostgreSQL در داکر
├── backend/                 # API (TypeScript)
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/db.ts
│   │   ├── middleware/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/jwt.ts
│   ├── db/
│   │   ├── schema.sql       # ساختار جداول (در اولین اجرای داکر خودکار اعمال می‌شود)
│   │   └── seed.ts          # داده‌های نمونه
│   ├── tsconfig.json
│   └── package.json
└── frontend/                # React + Vite (TypeScript)
    ├── src/
    │   ├── main.tsx / App.tsx
    │   ├── api.ts
    │   ├── types/
    │   ├── context/AuthContext.tsx
    │   ├── components/
    │   ├── pages/           # Login, Dashboard, Invoices, Customers
    │   ├── utils/
    │   └── styles/style.css
    ├── tsconfig.json
    └── package.json
```

## پیش‌نیازها

- Node.js 18 یا بالاتر
- Docker Desktop (برای دیتابیس)

## راه‌اندازی (مرحله‌به‌مرحله، PowerShell / ویندوز)

### ۱) بالا آوردن دیتابیس با داکر

```powershell
docker compose up -d
```

در اولین اجرا، دیتابیس `ay_dashboard` ساخته و جداول (`schema.sql`) خودکار اعمال می‌شوند. وضعیت را می‌توانی با `docker compose ps` ببینی (باید `healthy` شود).

### ۲) بک‌اند

```powershell
cd backend
copy .env.example .env
npm install
npm run seed        # کاربر مدیر + داده‌های نمونه
npm run dev         # اجرا روی http://localhost:4000
```

بررسی سلامت: `http://localhost:4000/api/health`

### ۳) فرانت‌اند (ترمینال جدا)

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev         # اجرا روی http://localhost:5173
```

**ورود پیش‌فرض:**
- ایمیل: `admin@ay-dashboard.local`
- رمز عبور: `admin123`

## دستورات مفید

| کار | دستور |
|---|---|
| توقف دیتابیس (داده‌ها می‌مانند) | `docker compose down` |
| پاک‌کردن کامل دیتابیس و شروع از صفر | `docker compose down -v` |
| مشاهده لاگ دیتابیس | `docker compose logs -f db` |
| ورود به psql داخل کانتینر | `docker exec -it ay-dashboard-db psql -U postgres -d ay_dashboard` |
| بررسی تایپ‌های بک‌اند | `cd backend && npx tsc --noEmit` |
| build بک‌اند / اجرای نسخه‌ی build | `npm run build` سپس `npm start` |
| build فرانت‌اند | `cd frontend && npm run build` |

> اگر بعد از تغییر `schema.sql` می‌خواهی دوباره اعمال شود، باید `docker compose down -v` و سپس `docker compose up -d` بزنی (فایل‌های initdb فقط وقتی volume خالی است اجرا می‌شوند).

## نکات فنی

- احراز هویت با JWT؛ رمزها با bcrypt هش می‌شوند.
- اتصال به دیتابیس با `pg`؛ کوئری‌ها با پارامتر (`$1, $2, ...`) نوشته شده‌اند.
- مسیرهای محافظت‌شده در فرانت با `ProtectedRoute` (React Router v6).
- نمودارها با Chart.js از طریق `react-chartjs-2`.
- تمام رابط راست‌به‌چپ (RTL) است.

## گام‌های بعدی پیشنهادی

- صفحه‌ی مدیریت تراکنش‌ها (فعلاً فقط از طریق seed/دیتابیس)
- تغییر رمز عبور و ویرایش پروفایل
- Pagination برای جدول‌ها
- کنترل دسترسی بر اساس نقش (manager / viewer)
- Dockerfile برای بک‌اند و فرانت و اضافه‌کردنشان به docker-compose

## گیت

```bash
git add -A
git commit -m "AY-Dashboard: TypeScript full stack + Docker PostgreSQL"
git push origin main
```
