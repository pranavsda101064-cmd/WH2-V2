import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye, FileText } from 'lucide-react';
import api from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  under_review: 'bg-blue-50 text-blue-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

const DOC_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  verified: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function Drivers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers', page, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      return api.get(`/drivers?${params}`).then((r) => r.data);
    },
  });

  const { data: driverDetail } = useQuery({
    queryKey: ['admin-driver-detail', selectedDriver],
    queryFn: () => api.get(`/drivers/${selectedDriver}`).then((r) => r.data),
    enabled: !!selectedDriver,
  });

  const statusMutation = useMutation({
    mutationFn: ({ driverId, status }: { driverId: string; status: string }) =>
      api.patch(`/drivers/${driverId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-driver-detail', selectedDriver] });
    },
  });

  const docMutation = useMutation({
    mutationFn: ({ driverId, docId, status }: { driverId: string; docId: string; status: string }) =>
      api.patch(`/drivers/${driverId}/documents/${docId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-driver-detail', selectedDriver] });
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text">Drivers</h1>

      <div className="flex gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-text-muted text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-canvas">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Name</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Email</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Docs</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((d: any) => (
                <tr key={d.id} className="border-t border-border hover:bg-canvas/50">
                  <td className="px-4 py-3 font-medium">{d.full_name}</td>
                  <td className="px-4 py-3">{d.email}</td>
                  <td className="px-4 py-3 text-text-muted">{d.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] || ''}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{d.doc_count} ({d.pending_docs} pending)</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedDriver(d.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {data?.items?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No drivers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Page {data.page} of {data.pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Driver detail modal */}
      {selectedDriver && driverDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDriver(null)}>
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-text">{driverDetail.full_name}</h3>
              <button onClick={() => setSelectedDriver(null)} className="text-text-muted hover:text-text">✕</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-text-muted">Email:</span> {driverDetail.email}</div>
                <div><span className="text-text-muted">Phone:</span> {driverDetail.phone}</div>
                <div><span className="text-text-muted">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[driverDetail.status]}`}>
                    {driverDetail.status}
                  </span>
                </div>
                <div><span className="text-text-muted">Online:</span> {driverDetail.is_online ? 'Yes' : 'No'}</div>
              </div>

              {/* Profile action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => statusMutation.mutate({ driverId: driverDetail.id, status: 'approved' })}
                  className="px-3 py-1.5 bg-success text-white text-xs rounded hover:opacity-90"
                >
                  <CheckCircle className="w-3 h-3 inline mr-1" /> Approve
                </button>
                <button
                  onClick={() => statusMutation.mutate({ driverId: driverDetail.id, status: 'rejected' })}
                  className="px-3 py-1.5 bg-danger text-white text-xs rounded hover:opacity-90"
                >
                  <XCircle className="w-3 h-3 inline mr-1" /> Reject
                </button>
              </div>

              {/* Vehicles */}
              {driverDetail.vehicles?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text mb-2">Vehicles</h4>
                  {driverDetail.vehicles.map((v: any) => (
                    <div key={v.id} className="text-sm bg-canvas p-2 rounded mb-1">
                      {v.vehicle_type} — {v.make} {v.model} ({v.year}) — {v.reg_number} — {v.seats} seats
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {driverDetail.documents?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text mb-2">Documents</h4>
                  <div className="space-y-2">
                    {driverDetail.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between bg-canvas p-2 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-text-muted" />
                          <span className="text-sm font-medium">{doc.doc_type}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DOC_STATUS_COLORS[doc.verification_status]}`}>
                            {doc.verification_status}
                          </span>
                        </div>
                        {doc.verification_status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => docMutation.mutate({ driverId: driverDetail.id, docId: doc.id, status: 'verified' })}
                              className="px-2 py-1 bg-success text-white text-xs rounded"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => docMutation.mutate({ driverId: driverDetail.id, docId: doc.id, status: 'rejected' })}
                              className="px-2 py-1 bg-danger text-white text-xs rounded"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
