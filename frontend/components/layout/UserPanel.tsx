'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PresenceStatus } from '@/types';
import { LogOut, Mic, Headphones, ChevronUp } from 'lucide-react';

export const UserPanel: React.FC = () => {
  const { user, setUserStatus, logout } = useAuthStore();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (!user) return null;

  const statusColors: Record<PresenceStatus, string> = {
    online: 'bg-[#23A55A]',
    idle: 'bg-[#F0B232]',
    dnd: 'bg-[#F23F43]',
    offline: 'bg-[#80848E]',
  };

  const handleStatusChange = async (status: PresenceStatus) => {
    await setUserStatus(status);
    setShowStatusMenu(false);
  };

  return (
    <div className="relative bg-[#111214]/80 p-2 flex items-center justify-between border-t border-[#202225]/50">
      {/* Status Picker Menu */}
      {showStatusMenu && (
        <div className="absolute bottom-14 left-2 w-48 bg-[#111214] border border-[#232428] rounded-lg shadow-xl p-1 z-50 flex flex-col space-y-1">
          <div className="px-2 py-1 text-xs font-semibold text-[#949BA4]">SET STATUS</div>
          {(['online', 'idle', 'dnd', 'offline'] as PresenceStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => handleStatusChange(st)}
              className="flex items-center space-x-2 px-2 py-1.5 text-xs rounded hover:bg-[#5865F2] hover:text-white text-[#F2F3F5] transition text-left"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${statusColors[st]}`} />
              <span className="capitalize">{st === 'dnd' ? 'Do Not Disturb' : st}</span>
            </button>
          ))}
        </div>
      )}

      {/* User Info & Avatar */}
      <div
        onClick={() => setShowStatusMenu(!showStatusMenu)}
        className="flex items-center space-x-2 p-1 rounded-md hover:bg-[#232428] cursor-pointer flex-1 min-w-0 mr-1 transition"
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-white text-xs">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111214] ${
              statusColors[user.status] || statusColors.online
            }`}
          />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-[#F2F3F5] truncate leading-tight">
            {user.display_name || user.username}
          </span>
          <span className="text-[10px] text-[#949BA4] truncate">
            @{user.username}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-0.5 text-[#949BA4]">
        <button
          onClick={logout}
          title="Log Out"
          className="p-1.5 hover:bg-[#232428] hover:text-[#F23F43] rounded cursor-pointer transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

