import { useCallback, useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import Toast from '../components/Toast';
import { apiRequest } from '../api';
import { formatToman, formatDate } from '../utils/format';
import { useToast } from '../utils/useToast';

const FILTERS = [
  { label: 'همه', value: '' },
  { label: 'پرداخت‌شده', value: 'paid' },
  { label: 'در انتظار', value: 'pending' },
  { label: 'معوق', value: 'overdue' },
];
const statusLabel = { paid: 'پرداخت‌شده', pending: 'در انتظار', overdue: 'معوق' };
const emptyForm = { invoice_no: '', customer_id: '', amount: '', issue_date: '', due_date: '' };

export default function Invoices() {
  const { message, showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (currentStatus) => {
    setLoading(true);
    try {
      const query = currentStatus ? `?status=${currentStatus}` : '';
      const rows = await apiRequest(`/invoices${query}`);
      setInvoices(rows);
    } catch (err) {
      showToast(err?.message || 'خطا در دریافت فاکتورها');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(status); }, [status, load]);

  useEffect(() => {
    apiRequest('/customers').then(setCustomers).catch(() => {});
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await apiRequest('/invoices', {
        method: 'POST',
        body: { ...form, customer_id: Number(form.customer_id), amount: Number(form.amount) },
      });
      showToast('فاکتور جدید ثبت شد.');
      setModalOpen(false);
      setForm(emptyForm);
      load(status);
    } catch (err) {
      showToast(err?.message || 'خطا در ثبت فاکتور');
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await apiRequest(`/invoices/${id}/status`, { method: 'PATCH', body: { status: newStatus } });
      showToast(`وضعیت فاکتور به «${statusLabel[newStatus]}» تغییر کرد.`);
      load(status);
    } catch (err) {
      showToast(err?.message || 'خطا در تغییر وضعیت');
    }
  }

  async function handleDelete(id) {
    if (!confirm('آیا از حذف این فاکتور مطمئن هستید؟')) return;
    try {
      await apiRequest(`/invoices/${id}`, { method: 'DELETE' });
      showToast('فاکتور حذف شد.');
      load(status);
    } catch (err) {
      showToast(err?.message || 'خطا در حذف فاکتور');
    }
  }

  return (
    <>
      <Topbar searchPlaceholder="جست‌وجوی شماره فاکتور..." />
      <div className="page">
        <div className="page-head">
          <div>
            <div className="page-title">فاکتورها</div>
            <div className="page-sub">پیگیری وضعیت پرداخت فاکتورهای صادرشده</div>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <span className="material-symbols-outlined">add</span>
            فاکتور جدید
          </button>
        </div>

        <div className="toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`btn btn-outline${status === f.value ? ' active' : ''}`}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="card">
          <table>
            <thead>
              <tr><th>شماره فاکتور</th><th>مشتری</th><th>تاریخ صدور</th><th>سررسید</th><th>مبلغ</th><th>وضعیت</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="empty-state">در حال بارگذاری...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">فاکتوری در این وضعیت یافت نشد</td></tr>
              ) : invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.invoice_no}</td>
                  <td>{i.customer_name}</td>
                  <td>{formatDate(i.issue_date)}</td>
                  <td>{formatDate(i.due_date)}</td>
                  <td>{formatToman(i.amount)}</td>
                  <td>
                    <select
                      className={`badge badge-${i.status}`}
                      value={i.status}
                      onChange={(e) => handleStatusChange(i.id, e.target.value)}
                    >
                      <option value="pending">در انتظار</option>
                      <option value="paid">پرداخت‌شده</option>
                      <option value="overdue">معوق</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} title="حذف" onClick={() => handleDelete(i.id)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3>فاکتور جدید</h3>
              <button className="icon-btn" onClick={() => setModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>شماره فاکتور</label>
                <input type="text" required placeholder="INV-1025" value={form.invoice_no}
                  onChange={(e) => setForm({ ...form, invoice_no: e.target.value })} />
              </div>
              <div className="field">
                <label>مشتری</label>
                <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                  <option value="">انتخاب کنید</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>مبلغ (تومان)</label>
                <input type="number" required min="0" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="field">
                <label>تاریخ صدور</label>
                <input type="date" required value={form.issue_date}
                  onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
              </div>
              <div className="field">
                <label>تاریخ سررسید</label>
                <input type="date" required value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>ثبت فاکتور</button>
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
