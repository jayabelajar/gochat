'use client';

import React from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { PresenceStatus } from '@/types';
import { MessageCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export const MemberSidebar: React.FC = () => {
  const { members, activeServerId, presenceMap, setActiveConversation, fetchConversations } = useChatStore();
  const { user: currentUser } = useAuthStore();

  if (!activeServerId) return null;

  const statusColors: Record<PresenceStatus, string> = {
    online: 'bg-[#23A55A]',
    idle: 'bg-[#F0B232]',
    dnd: 'bg-[#F23F43]',
    offline: 'bg-[#80848E]',
  };

  const onlineMembers = members.filter((m) => {
    const status = (presenceMap[m.user_id] || m.user?.status || 'offline') as PresenceStatus;
    return status !== 'offline';
  });

  const offlineMembers = members.filter((m) => {
    const status = (presenceMap[m.user_id] || m.user?.status || 'offline') as PresenceStatus;
    return status === 'offline';
  });

  const handleStartDM = async (targetUserId: string) => {
    if (targetUserId === currentUser?.id) return;
    try {
      const conv = await apiRequest('/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipient_id: targetUserId }),
      });
      await fetchConversations();
      setActiveConversation(conv.id);
    } catch (err) {
      console.error('Failed to start DM', err);
    }
  };

  const renderMember = (m: (typeof members)[0]) => {
    const status = (presenceMap[m.user_id] || m.user?.status || 'offline') as PresenceStatus;
    const isSelf = m.user_id === currentUser?.id;

    return (
      <div
        key={m.id}
        className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#232428] cursor-pointer transition select-none"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-white text-xs">
              {(m.nickname || m.user?.display_name || m.user?.username || 'U')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#17181B] ${
                statusColors[status] || statusColors.offline
              }`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <span
              className="text-xs font-medium truncate"
              style={{ color: m.role?.color || '#F2F3F5' }}
            >
              {m.nickname || m.user?.display_name || m.user?.username}
            </span>
            {m.role && (
              <span className="text-[10px] text-[#949BA4]">{m.role.name}</span>
            )}
          </div>
        </div>

        {!isSelf && (
          <button
            onClick={() => handleStartDM(m.user_id)}
            title="Send Direct Message"
            className="opacity-0 group-hover:opacity-100 p-1 text-[#949BA4] hover:text-white transition"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className="w-60 bg-[#17181B] flex flex-col shrink-0 select-none border-l border-[#202225]/40 p-3 overflow-y-auto space-y-4">
      {/* Online section */}
      <div>
        <h3 className="text-xs font-semibold text-[#949BA4] tracking-wider px-2 mb-1">
          ONLINE — {onlineMembers.length}
        </h3>
        <div className="space-y-0.5">{onlineMembers.map(renderMember)}</div>
      </div>

      {/* Offline section */}
      {offlineMembers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#949BA4] tracking-wider px-2 mb-1">
            OFFLINE — {offlineMembers.length}
          </h3>
          <div className="space-y-0.5 opacity-70">{offlineMembers.map(renderMember)}</div>
        </div>
      )}
    </aside>
  );
};

