import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Check, X } from 'lucide-react';
import api from '../lib/api';

export default function Pricing() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fareValue, setFareValue] = useState(0);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: () => api.get('/vehicles').then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fare }: { id: string; fare: number }) => api.put(`/vehicles/${id}`, { fare }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      setEditingId(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">PRICING</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>
      <p className="text-sm text-text-muted tracking-wider">// PER-KM FARE RATES</p>

      {isLoading ? (
        <div className="text-primary text-sm py-8 text-center tracking-widest animate-pulse">// LOADING...</div>
      ) : (
        <div className="bg-surface border border-border rounded overflow-hidden glow-cyan-box relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">VEHICLE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">DESCRIPTION</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">SEATS</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">ETA</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">FARE (₹/KM)</th>
                <th className="text-right px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {vehicles?.map((v: any) => (
                <tr key={v.id} className="border-t border-border/50 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{v.name}</td>
                  <td className="px-4 py-3 text-text-muted">{v.desc}</td>
                  <td className="px-4 py-3 text-text">{v.seats}</td>
                  <td className="px-4 py-3 text-text">{v.eta}</td>
                  <td className="px-4 py-3">
                    {editingId === v.id ? (
                      <input
                        type="number"
                        value={fareValue}
                        onChange={(e) => setFareValue(Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-canvas border border-primary rounded text-sm text-text"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-accent">₹{v.fare}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === v.id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => updateMutation.mutate({ id: v.id, fare: fareValue })} className="p-1 bg-success/10 border border-success/30 rounded hover:bg-success/20">
                          <Check className="w-4 h-4 text-success" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 bg-danger/10 border border-danger/30 rounded hover:bg-danger/20">
                          <X className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(v.id); setFareValue(v.fare); }} className="p-1 hover:bg-primary/10 rounded border border-transparent hover:border-primary/30 transition-all">
                        <Pencil className="w-4 h-4 text-primary/60" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
