import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../lib/api';

interface Place {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  duration: string;
  stops: number;
  image: string;
}

const EMPTY_PLACE: Place = { id: '', title: '', subtitle: '', price: 0, duration: '', stops: 1, image: '' };

export default function Places() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Place | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: places, isLoading } = useQuery({
    queryKey: ['admin-places'],
    queryFn: () => api.get('/places').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (place: Place) => {
      if (isNew) return api.post('/places', place);
      return api.put(`/places/${place.id}`, place);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-places'] });
      setEditing(null);
      setIsNew(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/places/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-places'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Places</h1>
        <button
          onClick={() => { setEditing({ ...EMPTY_PLACE }); setIsNew(true); }}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4" /> Add Place
        </button>
      </div>

      {isLoading ? (
        <div className="text-text-muted text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-canvas">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Image</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Title</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Subtitle</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Price</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Stops</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {places?.map((p: Place) => (
                <tr key={p.id} className="border-t border-border hover:bg-canvas/50">
                  <td className="px-4 py-2">
                    <img src={p.image} alt="" className="w-12 h-8 object-cover rounded" />
                  </td>
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-text-muted">{p.subtitle}</td>
                  <td className="px-4 py-3">₹{p.price.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">{p.duration}</td>
                  <td className="px-4 py-3">{p.stops}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditing(p); setIsNew(false); }} className="p-1 hover:bg-canvas rounded mr-1">
                      <Pencil className="w-4 h-4 text-text-muted" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this place?')) deleteMutation.mutate(p.id); }} className="p-1 hover:bg-danger/10 rounded">
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit dialog */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setEditing(null); setIsNew(false); }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-text">{isNew ? 'Add Place' : 'Edit Place'}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-text-muted hover:text-text">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {!isNew && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">ID</label>
                  <input value={editing.id} disabled className="w-full px-3 py-2 border border-border rounded-md text-sm bg-canvas" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Title</label>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Subtitle</label>
                <input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Price (₹)</label>
                  <input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Duration</label>
                  <input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Stops</label>
                  <input type="number" value={editing.stops} onChange={(e) => setEditing({ ...editing, stops: Number(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Image URL</label>
                <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="w-full px-3 py-2 border border-border rounded-md text-sm" />
              </div>
              <button
                onClick={() => saveMutation.mutate(editing)}
                disabled={saveMutation.isPending}
                className="w-full bg-primary text-white py-2 rounded-md text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
