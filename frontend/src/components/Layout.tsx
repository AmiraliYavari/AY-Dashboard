import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LayoutContext } from '../context/LayoutContext';

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('ay_sidebar') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    localStorage.setItem('ay_sidebar', collapsed ? 'collapsed' : 'open');
  }, [collapsed]);

  // close the mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Esc closes the drawer; body scroll is locked while it is open
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // the floating sidebar lifts slightly once the page starts scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openMenu = useCallback(() => setMobileOpen(true), []);
  const ctx = useMemo(() => ({ openMenu }), [openMenu]);

  return (
    <LayoutContext.Provider value={ctx}>
      <div className={`app-shell${collapsed ? ' is-collapsed' : ''}${scrolled ? ' is-scrolled' : ''}`}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onClose={() => setMobileOpen(false)}
        />
        <div className={`backdrop${mobileOpen ? ' show' : ''}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />
        <div className="main">
          <Outlet />
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
