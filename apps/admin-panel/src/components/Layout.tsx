import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, MapPin, Car, Map, DollarSign,
  Bell, Settings, LogOut, ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/rides', icon: MapPin, label: 'Rides' },
  { to: '/drivers', icon: Car, label: 'Drivers' },
  { to: '/places', icon: Map, label: 'Places' },
  { to: '/pricing', icon: DollarSign, label: 'Pricing' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-white border-r border-border flex flex-col transition-all duration-200`}>
        <div className="flex items-center justify-between px-3 py-4 border-b border-border">
          {!collapsed && <span className="font-bold text-primary text-lg">Where2 Admin</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-canvas rounded">
            <ChevronLeft className={`w-4 h-4 text-text-muted transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-text-muted hover:bg-canvas hover:text-text'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          {!collapsed && (
            <div className="text-xs text-text-muted mb-2 truncate">{admin?.email}</div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-sm text-danger hover:bg-danger/10 px-3 py-2 rounded w-full ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
