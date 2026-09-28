import { useCallback, useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import Toast from '../components/Toast';
import { apiRequest } from '../api';
import { useToast } from '../utils/useToast';

const emptyForm = { id: '', name: '', company: '', email: '', phone: '', status: 'active' };

export default function Customers() {
  const { message, showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const rows = await apiRequest(`/customers?search=${encodeURIComponent(search)}`);
      setCustomers(rows);
    } catch (err) {
      showToast(err?.message || 'خطا در دریافت مشتریان');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  let debounceRef;
  function handleSearch(value) {
    clearTimeout(debounceRef);
    debounceRef = setTimeout(() => load(value), 300);
  }

  function openModal(customer = null) {
    setForm(customer ? { ...customer } : emptyForm);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(), company: form.company.trim(),
      email: form.email.trim(), phone: form.phone.trim(), status: form.status,
    };
    try {
      if (form.id) {
        await apiRequest(`/customers/${form.id}`, { method: 'PUT', body: payload });
        showToast('مشتری به‌روزرسانی شد.');
      } else {
        await apiRequest('/customers', { method: 'POST', body: payload });
        showToast('مشتری جدید اضافه شد.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err?.message || 'خطا در ذخیره‌سازی مشتری');
    }
  }

  async function handleDelete(id) {
    if (!confirm('آیا از حذف این مشتری مطمئن هستید؟')) return;
    try {
      await apiRequest(`/customers/${id}`, { method: 'DELETE' });
      showToast('مشتری حذف شد.');
      load();
    } catch (err) {
      showToast(err?.message || 'خطا در حذف مشتری');
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

        <div className="card">
          <table>
            <thead><tr><th>نام</th><th>شرکت</th><th>تماس</th><th>وضعیت</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="empty-state">در حال بارگذاری...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">مشتری‌ای یافت نشد. یک مشتری جدید اضافه کنید.</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id}>
                  <td><span className="avatar-mini">{c.name.charAt(0)}</span>{c.name}</td>
                  <td>{c.company || '—'}</td>
                  <td>{c.phone || c.email || '—'}</td>
                  <td>
                    <span className={`badge badge-${c.status === 'active' ? 'paid' : 'overdue'}`}>
                      {c.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} title="ویرایش" onClick={() => openModal(c)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} title="حذف" onClick={() => handleDelete(c.id)}>
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
              <h3>{form.id ? 'ویرایش مشتری' : 'مشتری جدید'}</h3>
              <button className="icon-btn" onClick={() => setModalOpen(false)}>
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
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>ذخیره</button>
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
