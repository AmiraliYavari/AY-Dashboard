import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabel: Record<string, string> = {
  admin: 'مدیر سیستم',
  manager: 'مدیر بخش',
  viewer: 'مشاهده‌گر',
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">آ</div>
        <div>
          <div className="brand-name">AY-Dashboard</div>
          <div className="brand-sub">مدیریت فروش و مالی</div>
        </div>
      </div>

      <nav className="nav-group">
        <div className="nav-label">اصلی</div>
        <NavLink className="nav-item" to="/" end>
          <span className="material-symbols-outlined">dashboard</span> نمای کلی
        </NavLink>
        <NavLink className="nav-item" to="/invoices">
          <span className="material-symbols-outlined">receipt_long</span> فاکتورها
        </NavLink>
        <NavLink className="nav-item" to="/customers">
          <span className="material-symbols-outlined">groups</span> مشتریان
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">{user?.name?.trim()?.charAt(0) || 'ک'}</div>
        <div>
          <div className="sidebar-user-name">{user?.name || '—'}</div>
          <div className="sidebar-user-role">{(user && roleLabel[user.role]) || user?.role || '—'}</div>
        </div>
        <button className="logout-btn" title="خروج" onClick={logout}>
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </aside>
  );
}
