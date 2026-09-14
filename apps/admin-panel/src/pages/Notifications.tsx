import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import api from '../lib/api';


export default function Notifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dataJson, setDataJson] = useState('');
  const [success, setSuccess] = useState(false);

  const sendMutation = useMutation({
    mutationFn: (payload: any) => api.post('/notifications/send', payload),
    onSuccess: () => {
      setTitle('');
      setBody('');
      setDataJson('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    let data: Record<string, string> = {};
    try {
      if (dataJson) data = JSON.parse(dataJson);
    } catch {
      alert('Invalid JSON in data field');
      return;
    }
    sendMutation.mutate({ title, body, data, audience: 'all' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="font-pixel text-sm text-primary glow-cyan">NOTIFICATIONS</h1>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      <div className="bg-surface border border-border rounded p-4 glow-cyan-box relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <h3 className="font-pixel text-[10px] text-primary mb-3 tracking-wider">PUSH TO ALL USERS</h3>
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="text-text-muted text-xs tracking-wider uppercase">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Notification title"
              className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text"
            />
          </div>
          <div>
            <label className="text-text-muted text-xs tracking-wider uppercase">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={3}
              placeholder="Notification message"
              className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text resize-none"
            />
          </div>
          <div>
            <label className="text-text-muted text-xs tracking-wider uppercase">Data (JSON, optional)</label>
            <textarea
              value={dataJson}
              onChange={(e) => setDataJson(e.target.value)}
              rows={2}
              placeholder='{"ride_id": "..."}'
              className="w-full mt-1 px-3 py-2 bg-canvas border border-border rounded text-sm text-text font-mono resize-none"
            />
          </div>
          {success && <p className="text-success text-xs tracking-wider">// NOTIFICATION SENT</p>}
          <button
            type="submit"
            disabled={sendMutation.isPending}
            className="w-full py-2 bg-primary/10 text-primary border border-primary text-xs rounded hover:bg-primary/20 tracking-wider uppercase disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-3 h-3" /> {sendMutation.isPending ? '// SENDING...' : '// SEND PUSH'}
          </button>
        </form>
      </div>
    </div>
  );
}
