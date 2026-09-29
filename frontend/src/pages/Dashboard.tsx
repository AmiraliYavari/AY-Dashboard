import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import Topbar from '../components/Topbar';
import Toast from '../components/Toast';
import { apiRequest } from '../api';
import { formatToman, formatDate } from '../utils/format';
import { useToast } from '../utils/useToast';
import { useTheme } from '../context/ThemeContext';
import type {
  ApiError, CategoryPoint, DashboardSummary, RecentTransaction, TopCustomer, TrendPoint,
} from '../types';

const CATEGORY_COLORS = ['#0e7c63', '#c08a2e', '#3a7ca5', '#8a6fbf', '#d6483f', '#16263d'];

type Tone = 'revenue' | 'expense' | 'profit' | 'outstanding';

export default function Dashboard() {
  const { message, showToast } = useToast();
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#8b9bb3' : '#67748a';
  const gridColor = theme === 'dark' ? '#1a2740' : '#edf0f5';
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryPoint[]>([]);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t, c, tx, tc] = await Promise.all([
          apiRequest<DashboardSummary>('/dashboard/summary'),
          apiRequest<TrendPoint[]>('/dashboard/revenue-trend'),
          apiRequest<CategoryPoint[]>('/dashboard/category-breakdown'),
          apiRequest<RecentTransaction[]>('/dashboard/recent-transactions'),
          apiRequest<TopCustomer[]>('/dashboard/top-customers'),
        ]);
        setSummary(s);
        setTrend(t);
        setCategories(c);
        setTransactions(tx);
        setTopCustomers(tc);
      } catch (err) {
        showToast((err as ApiError)?.message || 'خطا در دریافت اطلاعات داشبورد');
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const marginHint = summary && summary.revenue > 0
    ? `حاشیه سود ${new Intl.NumberFormat('fa-IR').format(Math.round((summary.netProfit / summary.revenue) * 100))}٪`
    : 'حاشیه سود —';
  const todayLabel = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date());

  return (
    <>
      <Topbar searchPlaceholder="جست‌وجوی فاکتور، مشتری، تراکنش..." />
      <div className="page">
        <div className="page-head">
          <div>
            <div className="page-title">نمای کلی مالی</div>
            <div className="page-sub">{todayLabel}</div>
          </div>
          <div className="page-actions">
            {summary && (
              <span className="chip">
                <span className="material-symbols-outlined">groups</span>
                مشتریان فعال <b>{new Intl.NumberFormat('fa-IR').format(summary.activeCustomers)}</b>
              </span>
            )}
            <button className="btn btn-outline" onClick={() => window.location.reload()}>
              <span className="material-symbols-outlined">refresh</span>
              به‌روزرسانی
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">در حال بارگذاری اطلاعات...</div>
        ) : (
          <>
            <div className="kpi-grid">
              <KpiCard tone="revenue" icon="payments" label="درآمد کل" value={formatToman(summary?.revenue)} hint="مجموع دریافتی‌ها" />
              <KpiCard tone="expense" icon="trending_down" label="هزینه‌ها" value={formatToman(summary?.expenses)} hint="مجموع پرداختی‌ها" />
              <KpiCard tone="profit" icon="savings" label="سود خالص" value={formatToman(summary?.netProfit)} hint={marginHint} />
              <KpiCard tone="outstanding" icon="receipt_long" label="مطالبات معوق" value={formatToman(summary?.outstanding.amount)} hint={`${new Intl.NumberFormat('fa-IR').format(summary?.outstanding.count ?? 0)} فاکتور باز`} />
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">روند درآمد و هزینه (۶ ماه اخیر)</div>
                  <span className="card-note">به تومان</span>
                </div>
                <div className="chart-box">
                <Line
                  data={{
                    labels: trend.map((r) => r.month),
                    datasets: [
                      {
                        label: 'درآمد', data: trend.map((r) => r.income),
                        borderColor: '#0e7c63', backgroundColor: 'rgba(14,124,99,0.1)',
                        tension: 0.35, fill: true, pointRadius: 3,
                      },
                      {
                        label: 'هزینه', data: trend.map((r) => r.expense),
                        borderColor: '#d6483f', backgroundColor: 'rgba(214,72,63,0.08)',
                        tension: 0.35, fill: true, pointRadius: 3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' }, color: tickColor, usePointStyle: true, boxWidth: 8 } } },
                    scales: {
                      x: { ticks: { font: { family: 'Vazirmatn' }, color: tickColor }, grid: { display: false } },
                      y: { ticks: { font: { family: 'Vazirmatn' }, color: tickColor }, grid: { color: gridColor } },
                    },
                  }}
                />
                </div>
              </div>

              <div className="card">
                <div className="card-head"><div className="card-title">درآمد به تفکیک دسته</div></div>
                <div className="chart-box donut">
                <Doughnut
                  data={{
                    labels: categories.map((c) => c.category),
                    datasets: [{ data: categories.map((c) => c.total), backgroundColor: CATEGORY_COLORS, borderWidth: 0, hoverOffset: 6 }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn', size: 11 }, color: tickColor, usePointStyle: true, boxWidth: 8 } } },
                    cutout: '66%',
                  }}
                />
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">تراکنش‌های اخیر</div>
                  <Link className="card-note" to="/invoices">مشاهده فاکتورها</Link>
                </div>
                <div className="table-scroll">
                <table className="table-stack">
                  <thead><tr><th>شرح</th><th>دسته</th><th>تاریخ</th><th>مبلغ</th></tr></thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={4} className="empty-state">هنوز تراکنشی ثبت نشده است</td></tr>
                    ) : transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="cell-primary">{t.description || (t.type === 'income' ? 'دریافتی' : 'پرداختی')}</td>
                        <td data-label="دسته"><span className={`badge badge-${t.type}`}>{t.category}</span></td>
                        <td data-label="تاریخ">{formatDate(t.txn_date)}</td>
                        <td data-label="مبلغ" className={`amount-${t.type}`}>{t.type === 'income' ? '+' : '−'} {formatToman(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">مشتریان برتر</div>
                  <Link className="card-note" to="/customers">مشاهده همه</Link>
                </div>
                <div className="table-scroll">
                <table>
                  <thead><tr><th>مشتری</th><th>مبلغ خرید</th></tr></thead>
                  <tbody>
                    {topCustomers.length === 0 ? (
                      <tr><td colSpan={2} className="empty-state">مشتری‌ای ثبت نشده است</td></tr>
                    ) : topCustomers.map((c) => (
                      <tr key={c.id}>
                        <td><div className="cell-name"><span className="avatar-mini">{c.name.charAt(0)}</span>{c.name}</div></td>
                        <td className="amount-income">{formatToman(c.total_billed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Toast message={message} />
    </>
  );
}

interface KpiCardProps {
  tone: Tone;
  icon: string;
  label: string;
  value: string;
  hint?: string;
}

function KpiCard({ tone, icon, label, value, hint }: KpiCardProps) {
  return (
    <div className="kpi-card" data-tone={tone}>
      <div className="kpi-top">
        <div className="kpi-label">{label}</div>
        <div className="kpi-icon"><span className="material-symbols-outlined">{icon}</span></div>
      </div>
      <div className="kpi-value figure">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}
