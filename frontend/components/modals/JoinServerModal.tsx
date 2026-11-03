'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useChatStore } from '@/stores/chatStore';
import { Server } from '@/types';
import { X, Compass } from 'lucide-react';

interface JoinServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinServerModal: React.FC<JoinServerModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { fetchServers, setActiveServer } = useChatStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const server = await apiRequest<Server>('/servers/join', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() }),
      });

      await fetchServers();
      setActiveServer(server.id);
      setCode('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid invitation code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#313338] w-full max-w-md rounded-lg overflow-hidden shadow-2xl border border-[#232428] animate-in fade-in zoom-in duration-150">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-[#5865F2]" />
              <h2 className="text-xl font-bold text-[#F2F3F5]">Join a Server</h2>
            </div>
            <button onClick={onClose} className="text-[#949BA4] hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-[#949BA4] mb-4">
            Enter an invite code below to join an existing server.
          </p>

          {error && (
            <div className="mb-4 p-2.5 bg-[#F23F43]/20 border border-[#F23F43] rounded text-xs text-[#F23F43]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#949BA4] uppercase mb-1">
                Invite Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 7f8a9b2c"
                className="w-full bg-[#1E1F22] text-[#F2F3F5] text-sm rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#F2F3F5] hover:underline"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-5 py-2.5 rounded transition disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Server'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

