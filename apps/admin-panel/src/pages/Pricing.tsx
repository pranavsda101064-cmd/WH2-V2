import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import api from '../lib/api';
import { SkeletonForm } from '../components/Skeleton';

export default function Pricing() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pricing'],
    queryFn: () => api.get('/pricing').then((r) => r.data),
  });

  const [edits, setEdits] = useState<Record<string, Partial<any>>>({});

  const saveMutation = useMutation({
    mutationFn: ({ id, ...rest }: any) => api.put(`/pricing/${id}`, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pricing'] });
      setEdits({});
    },
  });

  const update = (id: string, field: string, value: any) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getDisplay = (v: any, field: string) => {
    if (edits[v.id]?.[field] !== undefined) return edits[v.id][field];
    return v[field];
  };

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">PRICING</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
        {hasChanges && (
          <button
            onClick={() => {
              Object.entries(edits).forEach(([id, fields]) => {
                saveMutation.mutate({ id, ...fields });
              });
            }}
            disabled={saveMutation.isPending}
            className="px-3 py-1.5 bg-success/10 text-success border border-success/30 text-xs rounded hover:bg-success/20 tracking-wider uppercase flex items-center gap-1 animate-pulse"
          >
            <Save className="w-3 h-3" /> Save All
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonForm fields={3} />
      ) : (
        <div className="space-y-3">
          {data?.map((v: any) => (
            <div key={v.id} className="bg-surface border border-border rounded p-3 glow-cyan-box relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-[10px] text-primary tracking-wider uppercase">{v.vehicle_type}</span>
                {edits[v.id] && <span className="text-[9px] text-accent font-pixel tracking-wider">MODIFIED</span>}
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <label className="text-text-muted text-[10px] tracking-wider uppercase">Base Fare (₹)</label>
                  <input
                    type="number"
                    value={getDisplay(v, 'base_fare')}
                    onChange={(e) => update(v.id, 'base_fare', parseFloat(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-canvas border border-border rounded text-text font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] tracking-wider uppercase">Per Km (₹)</label>
                  <input
                    type="number"
                    value={getDisplay(v, 'per_km')}
                    onChange={(e) => update(v.id, 'per_km', parseFloat(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-canvas border border-border rounded text-text font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] tracking-wider uppercase">Per Min (₹)</label>
                  <input
                    type="number"
                    value={getDisplay(v, 'per_min')}
                    onChange={(e) => update(v.id, 'per_min', parseFloat(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-canvas border border-border rounded text-text font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] tracking-wider uppercase">Min Fare (₹)</label>
                  <input
                    type="number"
                    value={getDisplay(v, 'min_fare')}
                    onChange={(e) => update(v.id, 'min_fare', parseFloat(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-canvas border border-border rounded text-text font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
