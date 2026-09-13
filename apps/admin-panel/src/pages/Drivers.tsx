import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye, FileText } from 'lucide-react';
import api from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border border-warning/30',
  under_review: 'bg-primary/10 text-primary border border-primary/30',
  approved: 'bg-success/10 text-success border border-success/30',
  rejected: 'bg-danger/10 text-danger border border-danger/30',
};

const DOC_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border border-warning/30',
  verified: 'bg-success/10 text-success border border-success/30',
  rejected: 'bg-danger/10 text-danger border border-danger/30',
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
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">DRIVERS</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      <div className="flex gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface border border-border rounded text-sm text-text"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-primary text-sm py-8 text-center tracking-widest animate-pulse">// LOADING...</div>
      ) : (
        <div className="bg-surface border border-border rounded overflow-hidden glow-cyan-box relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">NAME</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">EMAIL</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">PHONE</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">STATUS</th>
                <th className="text-left px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">DOCS</th>
                <th className="text-right px-4 py-3 font-pixel text-[9px] text-primary tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((d: any) => (
                <tr key={d.id} className="border-t border-border/50 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{d.full_name}</td>
                  <td className="px-4 py-3 text-text">{d.email}</td>
                  <td className="px-4 py-3 text-text-muted">{d.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wider uppercase ${STATUS_COLORS[d.status] || ''}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{d.doc_count} ({d.pending_docs} pending)</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedDriver(d.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 tracking-wider uppercase"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {data?.items?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">// NO DRIVERS FOUND</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted tracking-wider">PAGE {data.page} / {data.pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40 hover:border-primary/50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-40 hover:border-primary/50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Driver detail modal */}
      {selectedDriver && driverDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedDriver(null)}>
          <div className="bg-surface border border-border rounded max-w-2xl w-full max-h-[80vh] overflow-auto glow-cyan-box relative" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-pixel text-xs text-primary glow-cyan">{driverDetail.full_name}</h3>
              <button onClick={() => setSelectedDriver(null)} className="text-text-muted hover:text-danger transition-colors font-pixel text-xs">[X]</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-text-muted tracking-wider uppercase text-xs">Email:</span> <span className="text-text">{driverDetail.email}</span></div>
                <div><span className="text-text-muted tracking-wider uppercase text-xs">Phone:</span> <span className="text-text">{driverDetail.phone}</span></div>
                <div><span className="text-text-muted tracking-wider uppercase text-xs">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wider uppercase ${STATUS_COLORS[driverDetail.status]}`}>
                    {driverDetail.status}
                  </span>
                </div>
                <div><span className="text-text-muted tracking-wider uppercase text-xs">Online:</span> <span className={driverDetail.is_online ? 'text-success' : 'text-danger'}>{driverDetail.is_online ? 'YES' : 'NO'}</span></div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => statusMutation.mutate({ driverId: driverDetail.id, status: 'approved' })}
                  className="px-3 py-1.5 bg-success/10 text-success border border-success/30 text-xs rounded hover:bg-success/20 tracking-wider uppercase flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={() => statusMutation.mutate({ driverId: driverDetail.id, status: 'rejected' })}
                  className="px-3 py-1.5 bg-danger/10 text-danger border border-danger/30 text-xs rounded hover:bg-danger/20 tracking-wider uppercase flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </div>

              {driverDetail.vehicles?.length > 0 && (
                <div>
                  <h4 className="font-pixel text-[10px] text-primary mb-2 tracking-wider">VEHICLES</h4>
                  {driverDetail.vehicles.map((v: any) => (
                    <div key={v.id} className="text-sm bg-canvas border border-border/50 p-2 rounded mb-1">
                      {v.vehicle_type} — {v.make} {v.model} ({v.year}) — {v.reg_number} — {v.seats} seats
                    </div>
                  ))}
                </div>
              )}

              {driverDetail.documents?.length > 0 && (
                <div>
                  <h4 className="font-pixel text-[10px] text-primary mb-2 tracking-wider">DOCUMENTS</h4>
                  <div className="space-y-2">
                    {driverDetail.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between bg-canvas border border-border/50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary/60" />
                          <span className="text-sm font-medium text-text">{doc.doc_type}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium tracking-wider uppercase ${DOC_STATUS_COLORS[doc.verification_status]}`}>
                            {doc.verification_status}
                          </span>
                        </div>
                        {doc.verification_status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => docMutation.mutate({ driverId: driverDetail.id, docId: doc.id, status: 'verified' })}
                              className="px-2 py-1 bg-success/10 text-success border border-success/30 text-xs rounded hover:bg-success/20"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => docMutation.mutate({ driverId: driverDetail.id, docId: doc.id, status: 'rejected' })}
                              className="px-2 py-1 bg-danger/10 text-danger border border-danger/30 text-xs rounded hover:bg-danger/20"
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
