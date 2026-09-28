import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'ورود ناموفق بود. اتصال به سرور را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand-mark" style={{ margin: '0 auto 14px', width: 44, height: 44, fontSize: 22 }}>آ</div>
        <div className="login-title">AY-Dashboard</div>
        <div className="login-sub">داشبورد مدیریت فروش و مالی</div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">ایمیل</label>
            <input
              id="email" type="email" required autoComplete="username"
              placeholder="admin@ay-dashboard.local"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">رمز عبور</label>
            <input
              id="password" type="password" required autoComplete="current-password"
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">login</span>
            {loading ? 'در حال ورود...' : 'ورود به داشبورد'}
          </button>
        </form>

        <div className="login-hint">نمونه ورود پیش‌فرض: admin@ay-dashboard.local / admin123</div>
      </div>
    </div>
  );
}
