'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'admin' | 'client' | null>(null);
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [clientForm, setClientForm] = useState({ spaceId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'admin', ...adminForm }),
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('adminToken', 'admin-session');
        router.push('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'client', spaceId: clientForm.spaceId, password: clientForm.password }),
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('clientSpace', data.spaceId);
        sessionStorage.setItem('clientName', data.spaceName);
        router.push(`/client/${data.spaceId}`);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Client Portal</h1>
          <p className="text-gray-400">File exchange and validation platform</p>
        </div>

        {!mode && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setMode('admin')}
              className="w-full py-4 px-6 bg-[#1a1a1a] hover:bg-[#27272a] border border-[#27272a] rounded-lg text-lg font-medium transition-colors"
            >
              Admin Access
            </button>
            <button
              onClick={() => setMode('client')}
              className="w-full py-4 px-6 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg text-lg font-medium transition-colors"
            >
              Client Portal
            </button>
          </div>
        )}

        {mode === 'admin' && (
          <div className="bg-[#111111] border border-[#27272a] rounded-lg p-6 animate-fadeIn">
            <button
              onClick={() => setMode(null)}
              className="text-sm text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            
            <h2 className="text-xl font-semibold mb-6">Admin Login</h2>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6]"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6]"
                  placeholder="••••••••"
                />
              </div>
              
              {error && <p className="text-red-400 text-sm">{error}</p>}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        )}

        {mode === 'client' && (
          <div className="bg-[#111111] border border-[#27272a] rounded-lg p-6 animate-fadeIn">
            <button
              onClick={() => setMode(null)}
              className="text-sm text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            
            <h2 className="text-xl font-semibold mb-6">Client Access</h2>
            
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Space Name</label>
                <input
                  type="text"
                  value={clientForm.spaceId}
                  onChange={(e) => setClientForm({ ...clientForm, spaceId: e.target.value.toLowerCase() })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6]"
                  placeholder="your-space-name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={clientForm.password}
                  onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6]"
                  placeholder="••••••••"
                />
              </div>
              
              {error && <p className="text-red-400 text-sm">{error}</p>}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Logging in...' : 'Access Space'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
