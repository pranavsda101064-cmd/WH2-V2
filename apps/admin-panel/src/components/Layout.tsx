import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Car, MapPin, DollarSign, Bell, Settings, LogOut } from 'lucide-react';
import api from '../lib/api';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/rides', icon: Car, label: 'Rides' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/places', icon: MapPin, label: 'Places' },
  { to: '/pricing', icon: DollarSign, label: 'Pricing' },
  { to: '/notifications', icon: Bell, label: 'Notify' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const nav = useNavigate();

  const logout = () => {
    localStorage.removeItem('admin_token');
    api.defaults.headers.common['Authorization'] = '';
    nav('/login');
  };

  return (
    <div className="flex h-screen bg-canvas grid-bg scanlines relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-surface border-r border-border flex flex-col relative z-10">
        {/* Brand */}
        <div className="p-4 border-b border-border">
          <h1 className="font-pixel text-sm text-primary glow-cyan flicker">WHERE2</h1>
          <p className="text-[10px] text-text-muted mt-1 tracking-widest uppercase">// admin panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary glow-cyan-box border border-primary/30'
                    : 'text-text-muted hover:text-text hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span className="tracking-wider uppercase text-xs">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-text-muted hover:text-danger hover:bg-danger/10 w-full transition-all border border-transparent hover:border-danger/30"
          >
            <LogOut className="w-4 h-4" />
            <span className="tracking-wider uppercase text-xs">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative z-10">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
