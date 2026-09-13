import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import api from '../lib/api';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/admin/login', { email, password });
      localStorage.setItem('admin_token', res.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      nav('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'ACCESS DENIED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas grid-bg scanlines flex items-center justify-center relative">
      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-primary/40" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-primary/40" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-primary/40" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-primary/40" />

      <div className="w-full max-w-sm px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-pixel text-xl text-primary glow-cyan flicker mb-2">WHERE2</h1>
          <p className="text-text-muted text-sm tracking-[0.3em] uppercase">// system access</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="bg-surface border border-border rounded p-6 space-y-4 glow-cyan-box relative">
          {/* Top accent line */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div>
            <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Identity</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-primary/60" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="admin@where2.in"
                className="w-full pl-10 pr-3 py-2.5 bg-canvas border border-border rounded text-sm text-text placeholder:text-text-muted/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1 tracking-widest uppercase">Passphrase</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-primary/60" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-canvas border border-border rounded text-sm text-text placeholder:text-text-muted/50"
              />
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger px-3 py-2 rounded text-sm glow-danger-box">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary/10 border border-primary text-primary font-pixel text-xs rounded hover:bg-primary/20 transition-all glow-cyan-box disabled:opacity-50 tracking-widest"
          >
            {loading ? '> AUTHENTICATING...' : '> ENTER SYSTEM'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-text-muted/40 text-xs mt-6 tracking-widest">
          SAKLESHPURA COMMAND CENTER
        </p>
      </div>
    </div>
  );
}
