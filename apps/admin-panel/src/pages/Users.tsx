import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';

export default function Users() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, role, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (role) params.set('role', role);
      if (search) params.set('search', search);
      return api.get(`/users?${params}`).then((r) => r.data);
    },
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}/ban`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text">Users</h1>

      <div className="flex gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email..."
              className="pl-8 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dark">Search</button>
        </form>

        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white"
        >
          <option value="">All roles</option>
          <option value="customer">Riders</option>
          <option value="driver">Drivers</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-text-muted text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-canvas">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Email</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Role</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((u: any) => (
                <tr key={u.id} className="border-t border-border hover:bg-canvas/50">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'driver' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_banned ? (
                      <span className="text-danger text-xs font-medium">Banned</span>
                    ) : (
                      <span className="text-success text-xs font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => banMutation.mutate(u.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                        u.is_banned
                          ? 'bg-success/10 text-success hover:bg-success/20'
                          : 'bg-danger/10 text-danger hover:bg-danger/20'
                      }`}
                    >
                      {u.is_banned ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
              {data?.items?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Page {data.page} of {data.pages} ({data.total} users)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
