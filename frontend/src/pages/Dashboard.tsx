import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Chart, Doughnut, Line, PolarArea } from 'react-chartjs-2';
import type { ScriptableContext, TooltipItem } from 'chart.js';
import Topbar from '../components/Topbar';
import Toast from '../components/Toast';
import CandleChart from '../components/CandleChart';
import KpiCard from '../components/KpiCard';
import ClockCard from '../components/ClockCard';
import { apiRequest } from '../api';
import { formatToman, formatDate } from '../utils/format';
import { useToast } from '../utils/useToast';
import { useTheme } from '../context/ThemeContext';
import type {
  ApiError, CandlePoint, CategoryPoint, DashboardSummary, InvoiceStatusPoint, InvoiceStatusKey,
  RecentTransaction, TopCustomer, TrendPoint,
} from '../types';

const CATEGORY_COLORS = ['#3f53a1', '#6f86e0', '#0e9f7e', '#c08a2e', '#d6483f', '#16263d'];

type TrendMode = 'line' | 'bar' | 'combo';
type CategoryMode = 'doughnut' | 'polar';

const nf = new Intl.NumberFormat('fa-IR');
const monthName = (ym: string) =>
  new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(new Date(`${ym}-15T12:00:00`));

const STATUS_META: Record<InvoiceStatusKey, { label: string; color: string; icon: string }> = {
  paid: { label: 'پرداخت‌شده', color: 'var(--success)', icon: 'task_alt' },
  pending: { label: 'در انتظار', color: 'var(--gold)', icon: 'schedule' },
  overdue: { label: 'معوق', color: 'var(--danger)', icon: 'error' },
};
const STATUS_HEX: Record<'light' | 'dark', Record<InvoiceStatusKey, string>> = {
  light: { paid: '#0e7c63', pending: '#b8801f', overdue: '#d6483f' },
  dark: { paid: '#23b28c', pending: '#e0a840', overdue: '#ef6a61' },
};

function areaGradient(ctx: ScriptableContext<'line'>, rgb: string) {
  const { chart } = ctx;
  const area = chart.chartArea;
  if (!area) return `rgba(${rgb},0.12)`;
  const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
  g.addColorStop(0, `rgba(${rgb},0.34)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  return g;
}

export default function Dashboard() {
  const { message, showToast } = useToast();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const P = dark
    ? { income: '#8ea1f2', incomeRgb: '142,161,242', expense: '#ef6a61', expenseRgb: '239,106,97', net: '#23b28c', tick: '#8b9bb3', grid: '#1a2740', tipBg: '#050a14', tipText: '#e7edf6', ring: '#111b2e' }
    : { income: '#3f53a1', incomeRgb: '63,83,161', expense: '#d6483f', expenseRgb: '214,72,63', net: '#0e7c63', tick: '#67748a', grid: '#edf0f5', tipBg: '#0d1727', tipText: '#ffffff', ring: '#ffffff' };
  const tickColor = P.tick;
  const gridColor = P.grid;
  const [trendMode, setTrendMode] = useState<TrendMode>('line');
  const [categoryMode, setCategoryMode] = useState<CategoryMode>('doughnut');
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatusPoint[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryPoint[]>([]);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, c, tx, tc, cd, is] = await Promise.all([
        apiRequest<DashboardSummary>('/dashboard/summary'),
        apiRequest<TrendPoint[]>('/dashboard/revenue-trend'),
        apiRequest<CategoryPoint[]>('/dashboard/category-breakdown'),
        apiRequest<RecentTransaction[]>('/dashboard/recent-transactions'),
        apiRequest<TopCustomer[]>('/dashboard/top-customers'),
        apiRequest<CandlePoint[]>('/dashboard/cashflow-candles'),
        apiRequest<InvoiceStatusPoint[]>('/dashboard/invoice-status'),
      ]);
      setSummary(s);
      setTrend(t);
      setCategories(c);
      setTransactions(tx);
      setTopCustomers(tc);
      setCandles(cd);
      setInvoiceStatus(is);
    } catch (err) {
      showToast((err as ApiError)?.message || 'خطا در دریافت اطلاعات داشبورد');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const font = { family: 'Vazirmatn' };
  const legend = { position: 'bottom' as const, labels: { font, color: tickColor, usePointStyle: true, boxWidth: 8, padding: 16 } };
  const moneyTip = {
    rtl: true, backgroundColor: P.tipBg, titleColor: P.tipText, bodyColor: P.tipText,
    padding: 11, cornerRadius: 10, boxPadding: 5, titleFont: { ...font, weight: 'bold' as const }, bodyFont: font,
    callbacks: {
      label: (c: TooltipItem<'line' | 'bar' | 'doughnut' | 'polarArea'>) =>
        ` ${c.dataset.label ? c.dataset.label + ': ' : c.label ? c.label + ': ' : ''}${formatToman(c.raw as number)}`,
    },
  };
  const axisScales = {
    x: { ticks: { font, color: tickColor }, grid: { display: false }, border: { display: false } },
    y: {
      ticks: { font, color: tickColor, callback: (v: string | number) => nf.format(Number(v) / 1_000_000) },
      grid: { color: gridColor }, border: { display: false },
    },
  };
  const cartesianOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend, tooltip: moneyTip },
    scales: axisScales,
  };
  const trendLabels = trend.map((r) => monthName(r.month));
  const incomeSeries = trend.map((r) => r.income);
  const expenseSeries = trend.map((r) => r.expense);
  const netSeries = trend.map((r) => r.income - r.expense);
  const barStyle = { borderRadius: 8, borderSkipped: false as const, maxBarThickness: 26 };
  const dotStyle = (color: string) => ({
    pointRadius: 3.5, pointHoverRadius: 6, pointBackgroundColor: P.ring, pointBorderColor: color, pointBorderWidth: 2, borderWidth: 2.5,
  });

  const paletteAlpha = (a: string) => CATEGORY_COLORS.map((c) => c + a);
  const statusHex = STATUS_HEX[dark ? 'dark' : 'light'];
  const statusTotalCount = invoiceStatus.reduce((n, r) => n + r.count, 0);
  const statusOrder: InvoiceStatusKey[] = ['paid', 'pending', 'overdue'];
  const statusRows = statusOrder.map((k) => invoiceStatus.find((r) => r.status === k) ?? { status: k, count: 0, total: 0 });

  const marginHint = summary && summary.revenue > 0
    ? `حاشیه سود ${new Intl.NumberFormat('fa-IR').format(Math.round((summary.netProfit / summary.revenue) * 100))}٪`
    : 'حاشیه سود —';

  return (
    <>
      <Topbar searchPlaceholder="جست‌وجوی فاکتور، مشتری، تراکنش..." />
      <div className="page">
        <div className="page-head page-head--clock">
          <div className="page-head-main">
            <ClockCard />
            <div>
              <div className="page-title">نمای کلی مالی</div>
              <div className="page-sub">خلاصه‌ی وضعیت فروش، هزینه و مطالبات</div>
            </div>
          </div>
          <div className="page-actions">
            {summary && (
              <span className="chip">
                <span className="material-symbols-outlined">groups</span>
                مشتریان فعال <b>{new Intl.NumberFormat('fa-IR').format(summary.activeCustomers)}</b>
              </span>
            )}
            <button className="btn btn-outline" onClick={load} disabled={loading}>
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
                  <div>
                    <div className="card-title">روند درآمد و هزینه (۶ ماه اخیر)</div>
                    <span className="card-note">به میلیون تومان</span>
                  </div>
                  <div className="tab-group" role="tablist" aria-label="نوع نمودار">
                    {([['line', 'show_chart', 'خطی'], ['bar', 'bar_chart', 'ستونی'], ['combo', 'stacked_line_chart', 'ترکیبی']] as const).map(([k, icon, label]) => (
                      <button key={k} role="tab" aria-selected={trendMode === k} className={trendMode === k ? 'on' : ''} onClick={() => setTrendMode(k)}>
                        <span className="material-symbols-outlined">{icon}</span><span className="tab-text">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="chart-box">
                  {trendMode === 'line' && (
                    <Line
                      data={{
                        labels: trendLabels,
                        datasets: [
                          { label: 'درآمد', data: incomeSeries, borderColor: P.income, backgroundColor: (c) => areaGradient(c, P.incomeRgb), tension: 0.4, fill: true, ...dotStyle(P.income) },
                          { label: 'هزینه', data: expenseSeries, borderColor: P.expense, backgroundColor: (c) => areaGradient(c, P.expenseRgb), tension: 0.4, fill: true, ...dotStyle(P.expense) },
                        ],
                      }}
                      options={cartesianOptions}
                    />
                  )}
                  {trendMode === 'bar' && (
                    <Bar
                      data={{
                        labels: trendLabels,
                        datasets: [
                          { label: 'درآمد', data: incomeSeries, backgroundColor: P.income, ...barStyle },
                          { label: 'هزینه', data: expenseSeries, backgroundColor: P.expense, ...barStyle },
                        ],
                      }}
                      options={cartesianOptions}
                    />
                  )}
                  {trendMode === 'combo' && (
                    <Chart
                      type="bar"
                      data={{
                        labels: trendLabels,
                        datasets: [
                          { type: 'bar' as const, label: 'درآمد', data: incomeSeries, backgroundColor: P.income + 'cc', ...barStyle },
                          { type: 'bar' as const, label: 'هزینه', data: expenseSeries, backgroundColor: P.expense + 'cc', ...barStyle },
                          { type: 'line' as const, label: 'سود خالص', data: netSeries, borderColor: P.net, backgroundColor: P.net, tension: 0.4, ...dotStyle(P.net) },
                        ],
                      }}
                      options={cartesianOptions}
                    />
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">درآمد به تفکیک دسته</div>
                  <div className="tab-group" role="tablist" aria-label="نوع نمودار">
                    <button role="tab" aria-selected={categoryMode === 'doughnut'} className={categoryMode === 'doughnut' ? 'on' : ''} onClick={() => setCategoryMode('doughnut')}>
                      <span className="material-symbols-outlined">donut_large</span><span className="tab-text">دونات</span>
                    </button>
                    <button role="tab" aria-selected={categoryMode === 'polar'} className={categoryMode === 'polar' ? 'on' : ''} onClick={() => setCategoryMode('polar')}>
                      <span className="material-symbols-outlined">radar</span><span className="tab-text">قطبی</span>
                    </button>
                  </div>
                </div>
                <div className="chart-box donut">
                  {categoryMode === 'doughnut' ? (
                    <Doughnut
                      data={{
                        labels: categories.map((c) => c.category),
                        datasets: [{ data: categories.map((c) => c.total), backgroundColor: CATEGORY_COLORS, borderColor: P.ring, borderWidth: 3, hoverOffset: 8 }],
                      }}
                      options={{
                        responsive: true, maintainAspectRatio: false, cutout: '68%',
                        plugins: { legend: { ...legend, labels: { ...legend.labels, font: { ...font, size: 11 } } }, tooltip: moneyTip },
                      }}
                    />
                  ) : (
                    <PolarArea
                      data={{
                        labels: categories.map((c) => c.category),
                        datasets: [{ data: categories.map((c) => c.total), backgroundColor: paletteAlpha('cc'), borderColor: CATEGORY_COLORS, borderWidth: 1.5 }],
                      }}
                      options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { ...legend, labels: { ...legend.labels, font: { ...font, size: 11 } } }, tooltip: moneyTip },
                        scales: { r: { ticks: { display: false }, grid: { color: gridColor }, angleLines: { color: gridColor } } },
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">نمودار کندل جریان نقدی (هفتگی)</div>
                    <span className="card-note">موجودی خالص (درآمد − هزینه) · به میلیون تومان</span>
                  </div>
                  <div className="legend-inline">
                    <span><i className="dot up" /> رشد موجودی</span>
                    <span><i className="dot down" /> کاهش موجودی</span>
                  </div>
                </div>
                <CandleChart data={candles} />
              </div>

              <div className="card">
                <div className="card-head"><div className="card-title">وضعیت فاکتورها</div></div>
                {statusTotalCount === 0 ? (
                  <div className="empty-state">هنوز فاکتوری ثبت نشده است</div>
                ) : (
                  <>
                    <div className="gauge-wrap">
                      <div className="chart-box gauge">
                        <Doughnut
                          data={{
                            labels: statusRows.map((r) => STATUS_META[r.status].label),
                            datasets: [{ label: 'مبلغ', data: statusRows.map((r) => r.total), backgroundColor: statusRows.map((r) => statusHex[r.status]), borderColor: P.ring, borderWidth: 3, borderRadius: 6, hoverOffset: 6 }],
                          }}
                          options={{
                            responsive: true, maintainAspectRatio: false, circumference: 180, rotation: -90, cutout: '74%',
                            plugins: { legend: { display: false }, tooltip: moneyTip },
                          }}
                        />
                      </div>
                      <div className="gauge-center">
                        <div className="figure gauge-num">{nf.format(statusTotalCount)}</div>
                        <div className="gauge-cap">فاکتور</div>
                      </div>
                    </div>
                    <ul className="status-list">
                      {statusRows.map((r) => (
                        <li key={r.status} style={{ '--c': STATUS_META[r.status].color } as CSSProperties}>
                          <span className="status-ico"><span className="material-symbols-outlined">{STATUS_META[r.status].icon}</span></span>
                          <span className="status-name">{STATUS_META[r.status].label}<small>{nf.format(r.count)} فاکتور</small></span>
                          <b className="status-amt">{formatToman(r.total)}</b>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
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