import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border border-warning/30',
  arriving: 'bg-primary/10 text-primary border border-primary/30',
  onboard: 'bg-accent/10 text-accent border border-accent/30',
  arrived: 'bg-accent-light/10 text-accent-light border border-accent-light/30',
  completed: 'bg-success/10 text-success border border-success/30',
  cancelled: 'bg-danger/10 text-danger border border-danger/30',
};

export default function Rides() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rides', page, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      return api.get(`/rides?${params}`).then((r) => r.data);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">RIDES</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      <div className="flex gap-3 items-center">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface border border-border rounded text-sm text-text"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="arriving">Arriving</option>
          <option value="onboard">Onboard</option>
          <option value="arrived">Arrived</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-primary text-sm py-8 text-center tracking-widest animate-pulse">// LOADING...</div>
      ) : (
        <div className="bg-surface border border-border rounded overflow-hidden glow-cyan-box relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">RIDE ID</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">RIDER</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">DRIVER</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">VEHICLE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">FARE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">STATUS</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">DATE</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((r: any) => (
                <tr key={r.id} className="border-t border-border/50 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{r.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-text">{r.rider_email}</td>
                  <td className="px-4 py-3 text-text-muted">{r.driver_id ? r.driver_id.slice(0, 8) + '...' : '-'}</td>
                  <td className="px-4 py-3 text-text">{r.vehicle_id}</td>
                  <td className="px-4 py-3 font-medium text-accent">₹{(r.fare || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wider uppercase ${STATUS_COLORS[r.status] || 'bg-white/5 text-text-muted border border-white/10'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {data?.items?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">// NO RIDES FOUND</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted tracking-wider">PAGE {data.page} / {data.pages} ({data.total} RIDES)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40 hover:border-primary/50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40 hover:border-primary/50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
