import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="app-shell">
      <div className="main">
        <Outlet />
      </div>
      <Sidebar />
    </div>
  );
}
