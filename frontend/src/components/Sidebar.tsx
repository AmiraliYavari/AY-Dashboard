import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const roleLabel: Record<string, string> = {
  admin: 'مدیر سیستم',
  manager: 'مدیر بخش',
  viewer: 'مشاهده‌گر',
};

const NAV = [
  { to: '/', label: 'نمای کلی', icon: 'space_dashboard', end: true },
  { to: '/transactions', label: 'تراکنش‌ها', icon: 'swap_horiz', end: false },
  { to: '/invoices', label: 'فاکتورها', icon: 'receipt_long', end: false },
  { to: '/customers', label: 'مشتریان', icon: 'groups', end: false },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar${mobileOpen ? ' is-open' : ''}`} aria-label="منوی اصلی">
      <div className="brand">
        <Logo size={40} />
        <div className="brand-text">
          <div className="brand-name">AY-Dashboard</div>
          <div className="brand-sub">مدیریت فروش و مالی</div>
        </div>
        <button className="sb-close" onClick={onClose} aria-label="بستن منو">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav className="nav-group">
        <div className="nav-label">منو</div>
        {NAV.map((item) => (
          <NavLink key={item.to} className="nav-item" to={item.to} end={item.end} data-label={item.label}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button
          className="collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
          data-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
        >
          <span className="material-symbols-outlined collapse-ico">keyboard_double_arrow_left</span>
          <span className="nav-text">جمع کردن منو</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user?.name?.trim()?.charAt(0) || 'ک'}</div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">{user?.name || '—'}</div>
            <div className="sidebar-user-role">{(user && roleLabel[user.role]) || user?.role || '—'}</div>
          </div>
          <button className="logout-btn" title="خروج" aria-label="خروج از حساب" onClick={logout}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
