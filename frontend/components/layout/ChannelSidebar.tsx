'use client';

import React from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { Hash, Plus, ChevronDown, Copy, Check, Users, MessageSquare } from 'lucide-react';
import { UserPanel } from './UserPanel';

interface ChannelSidebarProps {
  onOpenCreateChannel: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({ onOpenCreateChannel }) => {
  const {
    servers,
    activeServerId,
    channels,
    activeChannelId,
    setActiveChannel,
    conversations,
    activeConversationId,
    setActiveConversation,
  } = useChatStore();

  const { user } = useAuthStore();
  const [copied, setCopied] = React.useState(false);

  const currentServer = servers.find((s) => s.id === activeServerId);

  const copyInviteCode = () => {
    if (currentServer?.invite_code) {
      navigator.clipboard.writeText(currentServer.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside className="w-60 bg-[#17181B] flex flex-col justify-between shrink-0 select-none border-r border-[#202225]/40">
      {/* Header */}
      <div className="h-12 border-b border-[#202225] px-4 flex items-center justify-between shadow-sm">
        {currentServer ? (
          <>
            <h2 className="font-semibold text-sm text-[#F2F3F5] truncate">
              {currentServer.name}
            </h2>
            <button
              onClick={copyInviteCode}
              title={`Invite code: ${currentServer.invite_code} (Click to copy)`}
              className="p-1 hover:bg-[#232428] rounded text-[#949BA4] hover:text-white transition flex items-center space-x-1"
            >
              {copied ? <Check className="w-4 h-4 text-[#23A55A]" /> : <Copy className="w-4 h-4" />}
            </button>
          </>
        ) : (
          <h2 className="font-semibold text-sm text-[#F2F3F5] flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#5865F2]" />
            <span>Direct Messages</span>
          </h2>
        )}
      </div>

      {/* Main Channel / Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {currentServer ? (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#949BA4] px-2 mb-1">
              <span className="tracking-wider">TEXT CHANNELS</span>
              <button
                onClick={onOpenCreateChannel}
                title="Create Channel"
                className="hover:text-white transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-0.5">
              {channels.map((channel) => {
                const isActive = activeChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-[#2B2D31] text-white'
                        : 'text-[#949BA4] hover:bg-[#1E1F22] hover:text-[#DBDEE1]'
                    }`}
                  >
                    <Hash className="w-4 h-4 shrink-0 text-[#949BA4]" />
                    <span className="truncate">{channel.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs font-semibold text-[#949BA4] px-2 mb-2 tracking-wider">
              CONVERSATIONS
            </div>
            {conversations.length === 0 ? (
              <div className="px-3 py-4 text-xs text-[#949BA4] text-center">
                No conversations yet. Connect with other users in a community server!
              </div>
            ) : (
              <div className="space-y-0.5">
                {conversations.map((conv) => {
                  const isActive = activeConversationId === conv.id;
                  const otherMember = conv.members?.find((m) => m.user_id !== user?.id)?.user;
                  const name = conv.name || otherMember?.display_name || otherMember?.username || 'Private Chat';

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-[#2B2D31] text-white'
                          : 'text-[#949BA4] hover:bg-[#1E1F22] hover:text-[#DBDEE1]'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Panel */}
      <UserPanel />
    </aside>
  );
};

