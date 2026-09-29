import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import type { ApiError } from '../types';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as ApiError)?.message || 'ورود ناموفق بود. اتصال به سرور را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <aside className="login-side">
        <div className="login-brand">
          <Logo size={46} />
          <b>AY-Dashboard</b>
        </div>
        <h2 className="login-headline">فروش و مالی کسب‌وکار، در یک نگاه</h2>
        <ul className="login-points">
          <li><span className="material-symbols-outlined">check_circle</span> درآمد، هزینه و سود خالص لحظه‌ای</li>
          <li><span className="material-symbols-outlined">check_circle</span> پیگیری فاکتورها و مطالبات معوق</li>
          <li><span className="material-symbols-outlined">check_circle</span> مدیریت مشتریان و تراکنش‌ها</li>
        </ul>
      </aside>

      <main className="login-main">
        <div className="login-card">
          <div className="login-mobile-logo"><Logo size={48} /></div>
          <h1 className="login-title">ورود به داشبورد</h1>
          <div className="login-sub">برای ادامه وارد حساب خود شوید</div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">ایمیل</label>
              <input
                id="email" type="email" required autoComplete="username" dir="ltr"
                placeholder="admin@ay-dashboard.local"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">رمز عبور</label>
              <input
                id="password" type="password" required autoComplete="current-password" dir="ltr"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: 44 }}>
              <span className="material-symbols-outlined">login</span>
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
          </form>

          <div className="login-hint">admin@ay-dashboard.local / admin123</div>
        </div>
      </main>
    </div>
  );
}
