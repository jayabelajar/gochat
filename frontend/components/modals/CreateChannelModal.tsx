'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useChatStore } from '@/stores/chatStore';
import { Channel } from '@/types';
import { X, Hash } from 'lucide-react';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { activeServerId, fetchChannels, setActiveChannel } = useChatStore();

  if (!isOpen || !activeServerId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    // Format channel name (lowercase, dashes instead of spaces)
    const formattedName = name.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      const channel = await apiRequest<Channel>(`/servers/${activeServerId}/channels`, {
        method: 'POST',
        body: JSON.stringify({
          name: formattedName,
          topic: topic.trim(),
          type: 'text',
        }),
      });

      await fetchChannels(activeServerId);
      setActiveChannel(channel.id);
      setName('');
      setTopic('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#313338] w-full max-w-md rounded-lg overflow-hidden shadow-2xl border border-[#232428] animate-in fade-in zoom-in duration-150">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold text-[#F2F3F5]">Create Channel</h2>
            <button onClick={onClose} className="text-[#949BA4] hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-[#949BA4] mb-4">
            in Text Channels
          </p>

          {error && (
            <div className="mb-4 p-2.5 bg-[#F23F43]/20 border border-[#F23F43] rounded text-xs text-[#F23F43]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#949BA4] uppercase mb-1">
                Channel Name
              </label>
              <div className="relative flex items-center">
                <Hash className="absolute left-3 w-4 h-4 text-[#949BA4]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="new-channel"
                  className="w-full bg-[#1E1F22] text-[#F2F3F5] text-sm rounded pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#949BA4] uppercase mb-1">
                Channel Topic (Optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What is this channel about?"
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
                {loading ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

