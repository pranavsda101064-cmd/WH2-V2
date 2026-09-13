import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import api from '../lib/api';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: geofence, isLoading } = useQuery({
    queryKey: ['admin-geofence'],
    queryFn: () => api.get('/geofence').then((r) => r.data),
  });

  const [form, setForm] = useState<any>(null);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put('/geofence', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-geofence'] });
      setForm(null);
    },
  });

  const geofenceData = form || geofence;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">SETTINGS</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      {/* Geofence */}
      <div className="bg-surface border border-border rounded p-4 space-y-4 glow-cyan-box relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <h3 className="font-pixel text-[10px] text-primary tracking-wider">SAKLESHPURA GEOFENCE</h3>
        <p className="text-sm text-text-muted tracking-wider">// BOUNDARY COORDINATES</p>

        {isLoading ? (
          <div className="text-primary text-sm tracking-widest animate-pulse">// LOADING...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Min Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={geofenceData?.min_lat || ''}
                  onChange={(e) => setForm({ ...geofenceData, min_lat: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Max Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={geofenceData?.max_lat || ''}
                  onChange={(e) => setForm({ ...geofenceData, max_lat: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Min Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={geofenceData?.min_lng || ''}
                  onChange={(e) => setForm({ ...geofenceData, min_lng: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Max Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={geofenceData?.max_lng || ''}
                  onChange={(e) => setForm({ ...geofenceData, max_lng: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text"
                />
              </div>
            </div>

            <button
              onClick={() => saveMutation.mutate(geofenceData)}
              disabled={!form || saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-xs rounded hover:bg-primary/20 disabled:opacity-50 tracking-wider uppercase glow-cyan-box"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? '> SAVING...' : '> SAVE GEOFENCE'}
            </button>
          </>
        )}
      </div>

      {/* App info */}
      <div className="bg-surface border border-border rounded p-4 space-y-2 glow-cyan-box relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <h3 className="font-pixel text-[10px] text-primary tracking-wider">SYSTEM INFO</h3>
        <div className="text-sm text-text-muted space-y-1 tracking-wider">
          <div>Backend: <span className="text-text">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</span></div>
          <div>Version: <span className="text-text">1.0.0</span></div>
          <div>Region: <span className="text-text">Sakleshpura, Karnataka</span></div>
        </div>
      </div>
    </div>
  );
}
