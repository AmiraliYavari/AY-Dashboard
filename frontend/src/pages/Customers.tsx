import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Topbar from '../components/Topbar';
import Toast from '../components/Toast';
import { apiRequest } from '../api';
import { useToast } from '../utils/useToast';
import type { ApiError, Customer, CustomerForm, CustomerStatus } from '../types';

const emptyForm: CustomerForm = { id: '', name: '', company: '', email: '', phone: '', status: 'active' };

export default function Customers() {
  const { message, showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const rows = await apiRequest<Customer[]>(`/customers?search=${encodeURIComponent(search)}`);
      setCustomers(rows);
    } catch (err) {
      showToast((err as ApiError)?.message || 'خطا در دریافت مشتریان');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(value), 300);
  }

  function openModal(customer: Customer | null = null) {
    setForm(
      customer
        ? {
            id: customer.id,
            name: customer.name,
            company: customer.company || '',
            email: customer.email || '',
            phone: customer.phone || '',
            status: customer.status,
          }
        : emptyForm
    );
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
    };
    try {
      if (form.id !== '') {
        await apiRequest(`/customers/${form.id}`, { method: 'PUT', body: payload });
        showToast('مشتری به‌روزرسانی شد.');
      } else {
        await apiRequest('/customers', { method: 'POST', body: payload });
        showToast('مشتری جدید اضافه شد.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast((err as ApiError)?.message || 'خطا در ذخیره‌سازی مشتری');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('آیا از حذف این مشتری مطمئن هستید؟')) return;
    try {
      await apiRequest(`/customers/${id}`, { method: 'DELETE' });
      showToast('مشتری حذف شد.');
      load();
    } catch (err) {
      showToast((err as ApiError)?.message || 'خطا در حذف مشتری');
    }
  }

  return (
    <>
      <Topbar searchPlaceholder="جست‌وجوی مشتری یا شرکت..." onSearch={handleSearch} />
      <div className="page">
        <div className="page-head">
          <div>
            <div className="page-title">مشتریان</div>
            <div className="page-sub">مدیریت اطلاعات و وضعیت مشتریان</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <span className="material-symbols-outlined">person_add</span>
            مشتری جدید
          </button>
        </div>

        <div className="card flush">
          <div className="table-scroll">
          <table className="table-stack">
            <thead><tr><th>نام</th><th>شرکت</th><th>تماس</th><th>وضعیت</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="empty-state">در حال بارگذاری...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">مشتری‌ای یافت نشد. یک مشتری جدید اضافه کنید.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id}>
                  <td className="cell-primary"><div className="cell-name"><span className="avatar-mini">{c.name.charAt(0)}</span>{c.name}</div></td>
                  <td data-label="شرکت">{c.company || '—'}</td>
                  <td data-label="تماس">{c.phone || c.email || '—'}</td>
                  <td data-label="وضعیت">
                    <span className={`badge badge-${c.status === 'active' ? 'paid' : 'overdue'}`}>
                      {c.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <button className="icon-btn sm" title="ویرایش" aria-label="ویرایش مشتری" onClick={() => openModal(c)}>
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button className="icon-btn sm danger" title="حذف" aria-label="حذف مشتری" onClick={() => handleDelete(c.id)}>
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
          <div className="modal">
            <div className="modal-head">
              <h3>{form.id !== '' ? 'ویرایش مشتری' : 'مشتری جدید'}</h3>
              <button className="icon-btn" onClick={() => setModalOpen(false)} aria-label="بستن">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>نام مشتری</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>نام شرکت</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="field">
                <label>ایمیل</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label>تلفن</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>وضعیت</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })}>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>ذخیره</button>
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
