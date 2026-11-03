'use client';

import React from 'react';
import { useChatStore } from '@/stores/chatStore';
import { MessageSquare, Plus, Compass } from 'lucide-react';

interface ServerSidebarProps {
  onOpenCreateServer: () => void;
  onOpenJoinServer: () => void;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({
  onOpenCreateServer,
  onOpenJoinServer,
}) => {
  const { servers, activeServerId, setActiveServer } = useChatStore();

  return (
    <aside className="w-[72px] bg-[#111214] flex flex-col items-center py-3 space-y-2 select-none z-20 shrink-0 border-r border-[#202225]/40">
      {/* Home / Direct Messages */}
      <button
        onClick={() => setActiveServer(null)}
        title="Direct Messages"
        className={`relative group flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 cursor-pointer ${
          activeServerId === null
            ? 'rounded-[16px] bg-[#5865F2] text-white'
            : 'bg-[#1A1B1E] text-[#949BA4] hover:bg-[#5865F2] hover:text-white'
        }`}
      >
        <span
          className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
            activeServerId === null ? 'h-10' : 'h-0 group-hover:h-5'
          }`}
        />
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Separator */}
      <div className="w-8 h-[2px] bg-[#232428] rounded my-1" />

      {/* Server List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-2 overflow-y-auto no-scrollbar">
        {servers.map((server) => {
          const isActive = activeServerId === server.id;
          const initials = server.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 3)
            .toUpperCase();

          return (
            <button
              key={server.id}
              onClick={() => setActiveServer(server.id)}
              title={server.name}
              className={`relative group flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 cursor-pointer font-semibold text-sm ${
                isActive
                  ? 'rounded-[16px] bg-[#5865F2] text-white shadow-lg'
                  : 'bg-[#1A1B1E] text-[#F2F3F5] hover:bg-[#5865F2] hover:text-white'
              }`}
            >
              <span
                className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive ? 'h-10' : 'h-0 group-hover:h-5'
                }`}
              />
              {server.icon_url ? (
                <img
                  src={server.icon_url}
                  alt={server.name}
                  className="w-full h-full object-cover rounded-inherit"
                />
              ) : (
                <span>{initials}</span>
              )}
            </button>
          );
        })}

        {/* Add Server Button */}
        <button
          onClick={onOpenCreateServer}
          title="Create a Server"
          className="group flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#1A1B1E] text-[#23A55A] hover:bg-[#23A55A] hover:text-white transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Join Server Button */}
        <button
          onClick={onOpenJoinServer}
          title="Join a Server"
          className="group flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#1A1B1E] text-[#5865F2] hover:bg-[#5865F2] hover:text-white transition-all duration-200 cursor-pointer"
        >
          <Compass className="w-6 h-6" />
        </button>
      </div>
    </aside>
  );
};

