import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function Notifications() {
  const [target, setTarget] = useState('all');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: () => {
      const payload: any = { target, title, body };
      if (target === 'user') payload.user_id = userId;
      return api.post('/notify', payload);
    },
    onSuccess: (res) => {
      setResult(`SENT TO ${res.data.sent} DEVICE(S)`);
      setTitle('');
      setBody('');
      setUserId('');
    },
    onError: (err: any) => {
      setResult(`ERROR: ${err.response?.data?.detail || 'TRANSMISSION FAILED'}`);
    },
  });

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">NOTIFY</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      <div className="bg-surface border border-border rounded p-4 space-y-4 glow-cyan-box relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div>
          <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Target</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text"
          >
            <option value="all">All users</option>
            <option value="drivers">All drivers</option>
            <option value="riders">All riders</option>
            <option value="user">Specific user</option>
          </select>
        </div>

        {target === 'user' && (
          <div>
            <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">User ID</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user UUID"
              className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text placeholder:text-text-muted/50"
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text placeholder:text-text-muted/50"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification message..."
            className="w-full px-3 py-2 bg-canvas border border-border rounded text-sm text-text placeholder:text-text-muted/50 h-24 resize-none"
            maxLength={500}
          />
        </div>

        {result && (
          <div className={`flex items-center gap-2 p-2 rounded text-sm ${
            result.startsWith('SENT') ? 'bg-success/10 text-success border border-success/30 glow-success-box' : 'bg-danger/10 text-danger border border-danger/30 glow-danger-box'
          }`}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            {result}
          </div>
        )}

        <button
          onClick={() => sendMutation.mutate()}
          disabled={!title || !body || sendMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary text-primary py-2 rounded text-sm font-medium hover:bg-primary/20 disabled:opacity-50 tracking-wider uppercase glow-cyan-box"
        >
          <Send className="w-4 h-4" />
          {sendMutation.isPending ? '> TRANSMITTING...' : '> SEND BROADCAST'}
        </button>
      </div>
    </div>
  );
}
