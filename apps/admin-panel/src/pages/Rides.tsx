import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import { SkeletonTable } from '../components/Skeleton';

const STATUS_VARIANT: Record<string, string> = {
  pending: 'warning',
  arriving: 'primary',
  onboard: 'accent',
  arrived: 'accent',
  completed: 'success',
  cancelled: 'danger',
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
    placeholderData: keepPreviousData,
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
        <SkeletonTable rows={8} cols={7} />
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
                    <Badge variant={STATUS_VARIANT[r.status] || 'muted'}>{r.status}</Badge>
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
        <Pagination page={data.page} pages={data.pages} total={data.total} totalLabel="rides" onPageChange={setPage} />
      )}
    </div>
  );
}
