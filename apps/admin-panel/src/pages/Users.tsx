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
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">USERS</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      <div className="flex gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-primary/60" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email..."
              className="pl-8 pr-3 py-2 bg-surface border border-border rounded text-sm text-text placeholder:text-text-muted/50 w-64"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-primary/10 border border-primary text-primary text-sm rounded hover:bg-primary/20 glow-cyan-box tracking-wider uppercase text-xs">Search</button>
        </form>

        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface border border-border rounded text-sm text-text"
        >
          <option value="">All roles</option>
          <option value="customer">Riders</option>
          <option value="driver">Drivers</option>
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
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">EMAIL</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">ROLE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">STATUS</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">JOINED</th>
                <th className="text-right px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((u: any) => (
                <tr key={u.id} className="border-t border-border/50 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 text-text">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wider uppercase ${
                      u.role === 'driver' ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-primary/10 text-primary border border-primary/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_banned ? (
                      <span className="text-danger text-xs font-medium tracking-wider uppercase">Banned</span>
                    ) : (
                      <span className="text-success text-xs font-medium tracking-wider uppercase">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => banMutation.mutate(u.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded tracking-wider uppercase ${
                        u.is_banned
                          ? 'bg-success/10 text-success border border-success/30 hover:bg-success/20'
                          : 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20'
                      }`}
                    >
                      {u.is_banned ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
              {data?.items?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">// NO USERS FOUND</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted tracking-wider">PAGE {data.page} / {data.pages} ({data.total} USERS)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40 hover:border-primary/50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40 hover:border-primary/50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
