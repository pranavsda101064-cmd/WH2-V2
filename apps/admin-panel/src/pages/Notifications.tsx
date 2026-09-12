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
      setResult(`Sent to ${res.data.sent} device(s)`);
      setTitle('');
      setBody('');
      setUserId('');
    },
    onError: (err: any) => {
      setResult(`Error: ${err.response?.data?.detail || 'Failed to send'}`);
    },
  });

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-text">Send Notification</h1>

      <div className="bg-white rounded-lg border border-border p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Target</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white"
          >
            <option value="all">All users</option>
            <option value="drivers">All drivers</option>
            <option value="riders">All riders</option>
            <option value="user">Specific user</option>
          </select>
        </div>

        {target === 'user' && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">User ID</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user UUID"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification message..."
            className="w-full px-3 py-2 border border-border rounded-md text-sm h-24 resize-none"
            maxLength={500}
          />
        </div>

        {result && (
          <div className={`flex items-center gap-2 p-2 rounded text-sm ${
            result.startsWith('Sent') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            {result}
          </div>
        )}

        <button
          onClick={() => sendMutation.mutate()}
          disabled={!title || !body || sendMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-md text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {sendMutation.isPending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>
    </div>
  );
}
