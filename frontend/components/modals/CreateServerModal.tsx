'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useChatStore } from '@/stores/chatStore';
import { Server } from '@/types';
import { X } from 'lucide-react';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { fetchServers, setActiveServer } = useChatStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const server = await apiRequest<Server>('/servers', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      await fetchServers();
      setActiveServer(server.id);
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#313338] w-full max-w-md rounded-lg overflow-hidden shadow-2xl border border-[#232428] animate-in fade-in zoom-in duration-150">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold text-[#F2F3F5]">Create Your Server</h2>
            <button onClick={onClose} className="text-[#949BA4] hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-[#949BA4] mb-4">
            Your server is where you and your friends hang out. Make yours and start talking.
          </p>

          {error && (
            <div className="mb-4 p-2.5 bg-[#F23F43]/20 border border-[#F23F43] rounded text-xs text-[#F23F43]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#949BA4] uppercase mb-1">
                Server Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Community"
                className="w-full bg-[#1E1F22] text-[#F2F3F5] text-sm rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#949BA4] uppercase mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about?"
                className="w-full bg-[#1E1F22] text-[#F2F3F5] text-sm rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#F2F3F5] hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-5 py-2.5 rounded transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Server'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

