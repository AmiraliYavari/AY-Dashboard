import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Topbar from '../components/Topbar';
import Toast from '../components/Toast';
import KpiCard from '../components/KpiCard';
import { apiRequest } from '../api';
import { formatToman, formatDate } from '../utils/format';
import { useToast } from '../utils/useToast';
import type { ApiError, Customer, Transaction, TransactionForm, TransactionType } from '../types';

type TypeFilter = '' | TransactionType;

const FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'همه', value: '' },
  { label: 'دریافتی', value: 'income' },
  { label: 'پرداختی', value: 'expense' },
];

const CATEGORIES = ['اشتراک نرم‌افزار', 'فروش محصول', 'خدمات مشاوره', 'اجاره دفتر', 'حقوق و دستمزد', 'تبلیغات'];

// local calendar date (toISOString() is UTC and returns "yesterday" after midnight in UTC+3:30 / +4)
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const emptyForm = (): TransactionForm => ({
  type: 'income', category: CATEGORIES[0], amount: '', customer_id: '', description: '', txn_date: today(),
});

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(Math.round(n));

export default function Transactions() {
  const { message, showToast } = useToast();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [type, setType] = useState<TypeFilter>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TransactionForm>(emptyForm);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (currentType: TypeFilter, currentSearch: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (currentType) qs.set('type', currentType);
      if (currentSearch) qs.set('search', currentSearch);
      const q = qs.toString();
      setRows(await apiRequest<Transaction[]>(`/transactions${q ? `?${q}` : ''}`));
    } catch (err) {
      showToast((err as ApiError)?.message || 'خطا در دریافت تراکنش‌ها');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(type, search); }, [type, search, load]);

  useEffect(() => {
    apiRequest<Customer[]>('/customers').then(setCustomers).catch(() => {});
  }, []);

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value.trim()), 300);
  }

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    rows.forEach((r) => (r.type === 'income' ? (income += Number(r.amount)) : (expense += Number(r.amount))));
    return { income, expense, net: income - expense };
  }, [rows]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await apiRequest('/transactions', {
        method: 'POST',
        body: {
          type: form.type,
          category: form.category,
          amount: Number(form.amount),
          customer_id: form.type === 'income' && form.customer_id ? Number(form.customer_id) : null,
          description: form.description.trim(),
          txn_date: form.txn_date,
        },
      });
      showToast('تراکنش جدید ثبت شد.');
      setModalOpen(false);
      setForm(emptyForm());
      load(type, search);
    } catch (err) {
      showToast((err as ApiError)?.message || 'خطا در ثبت تراکنش');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('آیا از حذف این تراکنش مطمئن هستید؟')) return;
    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
      showToast('تراکنش حذف شد.');
      load(type, search);
    } catch (err) {
      showToast((err as ApiError)?.message || 'خطا در حذف تراکنش');
    }
  }

  return (
    <>
      <Topbar searchPlaceholder="جست‌وجوی شرح، دسته یا مشتری..." onSearch={handleSearch} />
      <div className="page">
        <div className="page-head">
          <div>
            <div className="page-title">تراکنش‌ها</div>
            <div className="page-sub">دریافتی‌ها و پرداختی‌های ثبت‌شده</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm()); setModalOpen(true); }}>
            <span className="material-symbols-outlined">add</span>
            تراکنش جدید
          </button>
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          <KpiCard tone="revenue" icon="south_west" label="جمع دریافتی" value={formatToman(totals.income)} />
          <KpiCard tone="expense" icon="north_east" label="جمع پرداختی" value={formatToman(totals.expense)} />
          <KpiCard tone="profit" icon="balance" label="تراز" value={formatToman(totals.net)} hint={`${fa(rows.length)} تراکنش در این نما`} />
        </div>

        <div className="toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`btn btn-outline${type === f.value ? ' active' : ''}`}
              onClick={() => setType(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="card flush">
          <div className="table-scroll">
            <table className="table-stack">
              <thead>
                <tr><th>شرح</th><th>دسته</th><th>مشتری</th><th>تاریخ</th><th>مبلغ</th><th></th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">در حال بارگذاری...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">تراکنشی یافت نشد. با «تراکنش جدید» اولین مورد را ثبت کنید.</td></tr>
                ) : rows.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-primary">{t.description || (t.type === 'income' ? 'دریافتی' : 'پرداختی')}</td>
                    <td data-label="دسته"><span className={`badge badge-${t.type}`}>{t.category}</span></td>
                    <td data-label="مشتری">{t.customer_name || '—'}</td>
                    <td data-label="تاریخ">{formatDate(t.txn_date)}</td>
                    <td data-label="مبلغ" className={`amount-${t.type}`}>{t.type === 'income' ? '+' : '−'} {formatToman(t.amount)}</td>
                    <td className="cell-actions">
                      <button className="icon-btn sm danger" title="حذف" aria-label="حذف تراکنش" onClick={() => handleDelete(t.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="تراکنش جدید">
            <div className="modal-head">
              <h3>تراکنش جدید</h3>
              <button className="icon-btn" onClick={() => setModalOpen(false)} aria-label="بستن">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="segmented" role="group" aria-label="نوع تراکنش">
                <button type="button" className={form.type === 'income' ? 'on-income' : ''}
                  onClick={() => setForm({ ...form, type: 'income' })}>دریافتی</button>
                <button type="button" className={form.type === 'expense' ? 'on-expense' : ''}
                  onClick={() => setForm({ ...form, type: 'expense', customer_id: '' })}>پرداختی</button>
              </div>
              <div className="field">
                <label htmlFor="txn-category">دسته</label>
                <select id="txn-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="txn-amount">مبلغ (تومان)</label>
                  <input id="txn-amount" type="number" required min="1" inputMode="numeric" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="txn-date">تاریخ</label>
                  <input id="txn-date" type="date" required value={form.txn_date}
                    onChange={(e) => setForm({ ...form, txn_date: e.target.value })} />
                </div>
              </div>
              {form.type === 'income' && (
                <div className="field">
                  <label htmlFor="txn-customer">مشتری (اختیاری)</label>
                  <select id="txn-customer" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                    <option value="">بدون مشتری</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="field">
                <label htmlFor="txn-desc">شرح</label>
                <input id="txn-desc" type="text" maxLength={255} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>ثبت تراکنش</button>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast message={message} />
    </>
  );
}