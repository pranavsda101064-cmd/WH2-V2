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
      <h1 className="text-xl font-bold text-text">Pricing</h1>
      <p className="text-sm text-text-muted">Per-km fare rates for each vehicle type.</p>

      {isLoading ? (
        <div className="text-text-muted text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-canvas">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Description</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Seats</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">ETA</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Fare (₹/km)</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles?.map((v: any) => (
                <tr key={v.id} className="border-t border-border hover:bg-canvas/50">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-text-muted">{v.desc}</td>
                  <td className="px-4 py-3">{v.seats}</td>
                  <td className="px-4 py-3">{v.eta}</td>
                  <td className="px-4 py-3">
                    {editingId === v.id ? (
                      <input
                        type="number"
                        value={fareValue}
                        onChange={(e) => setFareValue(Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-primary rounded text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">₹{v.fare}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === v.id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => updateMutation.mutate({ id: v.id, fare: fareValue })} className="p-1 bg-success/10 rounded hover:bg-success/20">
                          <Check className="w-4 h-4 text-success" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 bg-danger/10 rounded hover:bg-danger/20">
                          <X className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(v.id); setFareValue(v.fare); }} className="p-1 hover:bg-canvas rounded">
                        <Pencil className="w-4 h-4 text-text-muted" />
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
