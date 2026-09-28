import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import Topbar from '../components/Topbar';
import Toast from '../components/Toast';
import { apiRequest } from '../api';
import { formatToman, formatDate } from '../utils/format';
import { useToast } from '../utils/useToast';
import type {
  ApiError, CategoryPoint, DashboardSummary, RecentTransaction, TopCustomer, TrendPoint,
} from '../types';

const CATEGORY_COLORS = ['#0e7c63', '#c08a2e', '#3a7ca5', '#8a6fbf', '#d6483f', '#16263d'];

type Tone = 'revenue' | 'expense' | 'profit' | 'outstanding';

export default function Dashboard() {
  const { message, showToast } = useToast();
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
          <button className="btn btn-outline" onClick={() => window.location.reload()}>
            <span className="material-symbols-outlined">refresh</span>
            به‌روزرسانی
          </button>
        </div>

        {loading ? (
          <div className="loading-state">در حال بارگذاری اطلاعات...</div>
        ) : (
          <>
            <div className="kpi-grid">
              <KpiCard tone="revenue" icon="payments" label="درآمد کل" value={formatToman(summary?.revenue)} />
              <KpiCard tone="expense" icon="trending_down" label="هزینه‌ها" value={formatToman(summary?.expenses)} />
              <KpiCard tone="profit" icon="savings" label="سود خالص" value={formatToman(summary?.netProfit)} />
              <KpiCard tone="outstanding" icon="receipt_long" label="مطالبات معوق" value={formatToman(summary?.outstanding.amount)} />
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">روند درآمد و هزینه (۶ ماه اخیر)</div>
                  <span className="card-note">به تومان</span>
                </div>
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
                    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' } } } },
                    scales: {
                      x: { ticks: { font: { family: 'Vazirmatn' } }, grid: { display: false } },
                      y: { ticks: { font: { family: 'Vazirmatn' } }, grid: { color: '#eef1f5' } },
                    },
                  }}
                  height={140}
                />
              </div>

              <div className="card">
                <div className="card-head"><div className="card-title">درآمد به تفکیک دسته</div></div>
                <Doughnut
                  data={{
                    labels: categories.map((c) => c.category),
                    datasets: [{ data: categories.map((c) => c.total), backgroundColor: CATEGORY_COLORS, borderWidth: 0 }],
                  }}
                  options={{
                    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn', size: 11 }, boxWidth: 10 } } },
                    cutout: '62%',
                  }}
                  height={180}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">تراکنش‌های اخیر</div>
                  <Link className="card-note" to="/invoices">مشاهده فاکتورها</Link>
                </div>
                <table>
                  <thead><tr><th>شرح</th><th>دسته</th><th>تاریخ</th><th>مبلغ</th></tr></thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={4} className="empty-state">هنوز تراکنشی ثبت نشده است</td></tr>
                    ) : transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.description || (t.type === 'income' ? 'دریافتی' : 'پرداختی')}</td>
                        <td><span className={`badge badge-${t.type}`}>{t.category}</span></td>
                        <td>{formatDate(t.txn_date)}</td>
                        <td className={`amount-${t.type}`}>{t.type === 'income' ? '+' : '−'} {formatToman(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">مشتریان برتر</div>
                  <Link className="card-note" to="/customers">مشاهده همه</Link>
                </div>
                <table>
                  <thead><tr><th>مشتری</th><th>مبلغ خرید</th></tr></thead>
                  <tbody>
                    {topCustomers.length === 0 ? (
                      <tr><td colSpan={2} className="empty-state">مشتری‌ای ثبت نشده است</td></tr>
                    ) : topCustomers.map((c) => (
                      <tr key={c.id}>
                        <td><span className="avatar-mini">{c.name.charAt(0)}</span>{c.name}</td>
                        <td className="amount-income">{formatToman(c.total_billed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
}

function KpiCard({ tone, icon, label, value }: KpiCardProps) {
  return (
    <div className="kpi-card" data-tone={tone}>
      <div className="kpi-top">
        <div className="kpi-icon"><span className="material-symbols-outlined">{icon}</span></div>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value figure">{value}</div>
    </div>
  );
}
