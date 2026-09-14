import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { IndianRupee, MapPin, Users, Clock } from 'lucide-react';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import { SkeletonStatCard, SkeletonChart } from '../components/Skeleton';

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/analytics/overview').then((r) => r.data),
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => api.get('/analytics/revenue?days=30').then((r) => r.data),
  });

  const { data: rides, isLoading: ridesLoading } = useQuery({
    queryKey: ['admin-rides-chart'],
    queryFn: () => api.get('/analytics/rides?days=30').then((r) => r.data),
  });

  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">DASHBOARD</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          <>
            <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard icon={IndianRupee} label="Revenue (today)" value={fmt(overview?.revenue?.today)} sub={`Week: ${fmt(overview?.revenue?.week)}`} />
            <StatCard icon={MapPin} label="Rides (today)" value={overview?.rides?.today || 0} sub={`Week: ${overview?.rides?.week || 0}`} />
            <StatCard icon={Users} label="Active Drivers" value={overview?.active_drivers || 0} sub={`Total: ${overview?.total_drivers || 0}`} />
            <StatCard icon={Clock} label="Pending Drivers" value={overview?.pending_drivers || 0} sub={`Riders: ${overview?.total_riders || 0}`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {revenueLoading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h3 className="font-pixel text-[10px] text-primary mb-3 tracking-wider">REVENUE // 30 DAYS</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,240,255,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b6b8a' }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#6b6b8a' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ background: '#0f0f23', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 4, fontFamily: 'VT323', fontSize: 14 }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {ridesLoading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h3 className="font-pixel text-[10px] text-primary mb-3 tracking-wider">RIDES // 30 DAYS</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rides || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,240,255,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b6b8a' }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#6b6b8a' }} />
                <Tooltip
                  contentStyle={{ background: '#0f0f23', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 4, fontFamily: 'VT323', fontSize: 14 }}
                />
                <Bar dataKey="rides" fill="#ff00ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
