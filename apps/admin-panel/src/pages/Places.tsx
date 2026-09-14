import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../lib/api';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { keepPreviousData } from '@tanstack/react-query';

const EMPTY_FORM = { name: '', description: '', address: '', lat: '', lng: '', category: 'attraction', image_url: '' };

export default function Places() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-places', page],
    queryFn: () => api.get(`/places?page=${page}&limit=20`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      editing ? api.put(`/places/${editing.id}`, payload) : api.post('/places', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-places'] });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/places/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin-places', page] });
      const previous = queryClient.getQueryData(['admin-places', page]);
      queryClient.setQueryData(['admin-places', page], (old: any) => ({
        ...old,
        items: old.items.filter((p: any) => p.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['admin-places', page], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-places'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
    });
  };

  const openEdit = (place: any) => {
    setEditing(place);
    setForm({
      name: place.name,
      description: place.description || '',
      address: place.address || '',
      lat: String(place.location?.coordinates?.[1] || ''),
      lng: String(place.location?.coordinates?.[0] || ''),
      category: place.category || 'attraction',
      image_url: place.image_url || '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-pixel text-sm text-primary glow-cyan">PLACES</h1>
          <div className="h-px w-32 bg-gradient-to-r from-primary/30 to-transparent" />
        </div>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}
          className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 text-xs rounded hover:bg-primary/20 tracking-wider uppercase flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : data?.items?.length === 0 ? (
        <EmptyState message="// NO PLACES FOUND" />
      ) : (
        <div className="bg-surface border border-border rounded overflow-hidden glow-cyan-box relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">NAME</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">CATEGORY</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">LAT</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">LNG</th>
                <th className="text-right px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((p: any) => (
                <tr key={p.id} className="border-t border-border/50 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 text-text">{p.name}</td>
                  <td className="px-4 py-3 text-text-muted">{p.category}</td>
                  <td className="px-4 py-3 text-text-muted font-mono text-xs">{p.location?.coordinates?.[1]}</td>
                  <td className="px-4 py-3 text-text-muted font-mono text-xs">{p.location?.coordinates?.[0]}</td>
                  <td className="px-4 py-3 text-right flex gap-1 justify-end">
                    <button onClick={() => openEdit(p)} className="p-1.5 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20"><Edit className="w-3 h-3" /></button>
                    <button onClick={() => { if (confirm('Delete this place?')) deleteMutation.mutate(p.id); }} className="p-1.5 bg-danger/10 text-danger border border-danger/30 rounded hover:bg-danger/20"><Trash2 className="w-3 h-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pages > 1 && (
        <Pagination page={data.page} pages={data.pages} total={data.total} totalLabel="places" onPageChange={setPage} />
      )}

      {showForm && (
        <Modal title={editing ? 'EDIT PLACE' : 'NEW PLACE'} onClose={() => { setShowForm(false); setEditing(null); }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-text-muted text-xs tracking-wider uppercase">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
            </div>
            <div>
              <label className="text-text-muted text-xs tracking-wider uppercase">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
            </div>
            <div>
              <label className="text-text-muted text-xs tracking-wider uppercase">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-text-muted text-xs tracking-wider uppercase">Latitude</label>
                <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} required step="any" className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text font-mono" />
              </div>
              <div>
                <label className="text-text-muted text-xs tracking-wider uppercase">Longitude</label>
                <input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} required step="any" className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text font-mono" />
              </div>
            </div>
            <div>
              <label className="text-text-muted text-xs tracking-wider uppercase">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text">
                <option value="attraction">Attraction</option>
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs tracking-wider uppercase">Image URL</label>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
            </div>
            <button disabled={saveMutation.isPending} className="w-full py-2 bg-primary/10 text-primary border border-primary text-xs rounded hover:bg-primary/20 tracking-wider uppercase disabled:opacity-50">
              {saveMutation.isPending ? '// SAVING...' : editing ? '// UPDATE' : '// CREATE'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
