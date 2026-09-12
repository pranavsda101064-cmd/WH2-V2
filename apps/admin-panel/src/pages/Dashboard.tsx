import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { IndianRupee, MapPin, Users, Clock } from 'lucide-react';
import api from '../lib/api';

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-2xl font-bold text-text">{value}</div>
          <div className="text-sm text-text-muted">{label}</div>
          {sub && <div className="text-xs text-text-muted">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/analytics/overview').then((r) => r.data),
  });

  const { data: revenue } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => api.get('/analytics/revenue?days=30').then((r) => r.data),
  });

  const { data: rides } = useQuery({
    queryKey: ['admin-rides-chart'],
    queryFn: () => api.get('/analytics/revenue?days=30').then((r) => r.data),
  });

  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Revenue (today)" value={fmt(overview?.revenue?.today)} sub={`Week: ${fmt(overview?.revenue?.week)}`} />
        <StatCard icon={MapPin} label="Rides (today)" value={overview?.rides?.today || 0} sub={`Week: ${overview?.rides?.week || 0}`} />
        <StatCard icon={Users} label="Active Drivers" value={overview?.active_drivers || 0} sub={`Total: ${overview?.total_drivers || 0}`} />
        <StatCard icon={Clock} label="Pending Drivers" value={overview?.pending_drivers || 0} sub={`Riders: ${overview?.total_riders || 0}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-text mb-3">Revenue (30 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#00897B" fill="#00897B" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-text mb-3">Rides (30 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rides || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="rides" fill="#00897B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
