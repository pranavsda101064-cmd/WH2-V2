import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { SkeletonForm } from '../components/Skeleton';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: system, isLoading } = useQuery({
    queryKey: ['admin-system'],
    queryFn: () => api.get('/settings/system').then((r) => r.data),
  });

  const { data: geofence } = useQuery({
    queryKey: ['admin-geofence'],
    queryFn: () => api.get('/settings/geofence').then((r) => r.data),
  });

  const [geofenceEdits, setGeofenceEdits] = useState<any>(null);

  useEffect(() => {
    if (geofence) setGeofenceEdits(geofence);
  }, [geofence]);

  const saveGeoMutation = useMutation({
    mutationFn: (payload: any) => api.put('/settings/geofence', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-geofence'] }),
  });

  const handleSave = () => {
    if (!geofenceEdits) return;
    saveGeoMutation.mutate({
      min_lat: parseFloat(geofenceEdits.min_lat),
      max_lat: parseFloat(geofenceEdits.max_lat),
      min_lng: parseFloat(geofenceEdits.min_lng),
      max_lng: parseFloat(geofenceEdits.max_lng),
    });
  };

  const updateField = (field: string, value: string) => {
    setGeofenceEdits((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">SETTINGS</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <h3 className="font-pixel text-[10px] text-primary mb-3 tracking-wider">GEOFENCE BOUNDS</h3>
          {isLoading ? (
            <SkeletonForm fields={4} />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-muted text-[10px] tracking-wider uppercase">Min Lat</label>
                  <input
                    type="number"
                    step="any"
                    value={geofenceEdits?.min_lat || ''}
                    onChange={(e) => updateField('min_lat', e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 bg-canvas border border-border rounded text-text font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] tracking-wider uppercase">Max Lat</label>
                  <input
                    type="number"
                    step="any"
                    value={geofenceEdits?.max_lat || ''}
                    onChange={(e) => updateField('max_lat', e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 bg-canvas border border-border rounded text-text font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] tracking-wider uppercase">Min Lng</label>
                  <input
                    type="number"
                    step="any"
                    value={geofenceEdits?.min_lng || ''}
                    onChange={(e) => updateField('min_lng', e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 bg-canvas border border-border rounded text-text font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-text-muted text-[10px] tracking-wider uppercase">Max Lng</label>
                  <input
                    type="number"
                    step="any"
                    value={geofenceEdits?.max_lng || ''}
                    onChange={(e) => updateField('max_lng', e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 bg-canvas border border-border rounded text-text font-mono text-xs"
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saveGeoMutation.isPending}
                className="w-full py-2 bg-primary/10 text-primary border border-primary text-xs rounded hover:bg-primary/20 tracking-wider uppercase disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-3 h-3" /> {saveGeoMutation.isPending ? '// SAVING...' : '// SAVE'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <h3 className="font-pixel text-[10px] text-primary mb-3 tracking-wider">SYSTEM INFO</h3>
          {isLoading ? (
            <SkeletonForm fields={3} />
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Environment</span><span className="text-text">{system?.environment || 'production'}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Database</span><span className="text-success">Connected</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Driver Radius</span><span className="text-text">{system?.driver_radius_km || 10} km</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Auto-assign Timeout</span><span className="text-text">{system?.auto_assign_timeout_sec || 30}s</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
