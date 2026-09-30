import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import GradientWaves from './GradientWaves';

const roleLabel: Record<string, string> = {
  admin: 'مدیر سیستم',
  manager: 'مدیر بخش',
  viewer: 'مشاهده‌گر',
};

const roleIcon: Record<string, string> = {
  admin: 'verified_user',
  manager: 'manage_accounts',
  viewer: 'visibility',
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

        <div className="user-card">
          <div className="user-card-bg" aria-hidden="true">
            <GradientWaves
              horizonColor="#0b1524"
              waveColor="#0e7c63"
              crestColor="#7ff0cf"
              speed={0.3}
              amplitude={2.2}
              swell={30}
              turbulence={18}
              fogDepth={16}
              detail="low"
              brightness={1.05}
              mouseInteraction={false}
              grain={false}
            />
          </div>

          <div className="user-card-body">
            <div className="user-id">
              <div className="user-avatar">
                {user?.name?.trim()?.charAt(0) || 'ک'}
                <span className="user-status" title="آنلاین" />
              </div>
              <div className="user-meta">
                <div className="user-name">{user?.name || '—'}</div>
                <div className="user-role">
                  <span className="material-symbols-outlined">{(user && roleIcon[user.role]) || 'person'}</span>
                  {(user && roleLabel[user.role]) || user?.role || '—'}
                </div>
              </div>
            </div>

            <button className="user-logout" onClick={logout} title="خروج از حساب" aria-label="خروج از حساب">
              <span className="material-symbols-outlined">logout</span>
              <span className="user-logout-text">خروج از حساب</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}