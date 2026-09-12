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
      <h1 className="text-xl font-bold text-text">Settings</h1>

      {/* Geofence */}
      <div className="bg-white rounded-lg border border-border p-4 space-y-4">
        <h3 className="font-semibold text-text">Sakleshpura Geofence</h3>
        <p className="text-sm text-text-muted">Define the boundary area where the app operates.</p>

        {isLoading ? (
          <div className="text-text-muted text-sm">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Min Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={geofenceData?.min_lat || ''}
                  onChange={(e) => setForm({ ...geofenceData, min_lat: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Max Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={geofenceData?.max_lat || ''}
                  onChange={(e) => setForm({ ...geofenceData, max_lat: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Min Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={geofenceData?.min_lng || ''}
                  onChange={(e) => setForm({ ...geofenceData, min_lng: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Max Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={geofenceData?.max_lng || ''}
                  onChange={(e) => setForm({ ...geofenceData, max_lng: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => saveMutation.mutate(geofenceData)}
              disabled={!form || saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Geofence'}
            </button>
          </>
        )}
      </div>

      {/* App info */}
      <div className="bg-white rounded-lg border border-border p-4 space-y-2">
        <h3 className="font-semibold text-text">App Info</h3>
        <div className="text-sm text-text-muted space-y-1">
          <div>Backend: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</div>
          <div>Version: 1.0.0</div>
          <div>Region: Sakleshpura, Karnataka</div>
        </div>
      </div>
    </div>
  );
}
