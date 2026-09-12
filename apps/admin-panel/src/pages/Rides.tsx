import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  arriving: 'bg-blue-50 text-blue-700',
  onboard: 'bg-indigo-50 text-indigo-700',
  arrived: 'bg-purple-50 text-purple-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
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
      <h1 className="text-xl font-bold text-text">Rides</h1>

      <div className="flex gap-3 items-center">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white"
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
        <div className="text-text-muted text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-canvas">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Ride ID</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Rider</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Driver</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Fare</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((r: any) => (
                <tr key={r.id} className="border-t border-border hover:bg-canvas/50">
                  <td className="px-4 py-3 font-mono text-xs">{r.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">{r.rider_email}</td>
                  <td className="px-4 py-3 text-text-muted">{r.driver_id ? r.driver_id.slice(0, 8) + '...' : '-'}</td>
                  <td className="px-4 py-3">{r.vehicle_id}</td>
                  <td className="px-4 py-3 font-medium">₹{(r.fare || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-50 text-gray-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {data?.items?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No rides found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Page {data.page} of {data.pages} ({data.total} rides)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
