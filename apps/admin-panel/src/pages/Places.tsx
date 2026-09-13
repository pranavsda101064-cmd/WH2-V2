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
        <div className="flex items-center gap-3">
          <h1 className="font-pixel text-sm text-primary glow-cyan">PLACES</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
        </div>
        <button
          onClick={() => { setEditing({ ...EMPTY_PLACE }); setIsNew(true); }}
          className="flex items-center gap-1 px-3 py-2 bg-primary/10 border border-primary text-primary text-xs rounded hover:bg-primary/20 glow-cyan-box tracking-wider uppercase"
        >
          <Plus className="w-4 h-4" /> Add Place
        </button>
      </div>

      {isLoading ? (
        <div className="text-primary text-sm py-8 text-center tracking-widest animate-pulse">// LOADING...</div>
      ) : (
        <div className="bg-surface border border-border rounded overflow-hidden glow-cyan-box relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">IMAGE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">TITLE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">SUBTITLE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">PRICE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">DURATION</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">STOPS</th>
                <th className="text-right px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {places?.map((p: Place) => (
                <tr key={p.id} className="border-t border-border/50 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-2">
                    <img src={p.image} alt="" className="w-12 h-8 object-cover rounded border border-border/50" />
                  </td>
                  <td className="px-4 py-3 font-medium text-text">{p.title}</td>
                  <td className="px-4 py-3 text-text-muted">{p.subtitle}</td>
                  <td className="px-4 py-3 text-accent">₹{p.price.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-text">{p.duration}</td>
                  <td className="px-4 py-3 text-text">{p.stops}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditing(p); setIsNew(false); }} className="p-1 hover:bg-primary/10 rounded mr-1 border border-transparent hover:border-primary/30 transition-all">
                      <Pencil className="w-4 h-4 text-primary/60" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this place?')) deleteMutation.mutate(p.id); }} className="p-1 hover:bg-danger/10 rounded border border-transparent hover:border-danger/30 transition-all">
                      <Trash2 className="w-4 h-4 text-danger/60" />
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => { setEditing(null); setIsNew(false); }}>
          <div className="bg-surface border border-border rounded max-w-md w-full glow-cyan-box relative" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-pixel text-xs text-primary glow-cyan">{isNew ? 'NEW PLACE' : 'EDIT PLACE'}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="text-text-muted hover:text-danger transition-colors font-pixel text-xs">[X]</button>
            </div>
            <div className="p-4 space-y-3">
              {!isNew && (
                <div>
                  <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">ID</label>
                  <input value={editing.id} disabled className="w-full px-3 py-2 bg-canvas border border-border/50 rounded text-sm text-text-muted" />
                </div>
              )}
              <div>
                <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Title</label>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Subtitle</label>
                <input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Price (₹)</label>
                  <input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Duration</label>
                  <input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Stops</label>
                  <input type="number" value={editing.stops} onChange={(e) => setEditing({ ...editing, stops: Number(e.target.value) })} className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Image URL</label>
                <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text" />
              </div>
              <button
                onClick={() => saveMutation.mutate(editing)}
                disabled={saveMutation.isPending}
                className="w-full bg-primary/10 border border-primary text-primary py-2 rounded text-sm font-medium hover:bg-primary/20 disabled:opacity-50 tracking-wider uppercase glow-cyan-box"
              >
                {saveMutation.isPending ? '> SAVING...' : '> SAVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
