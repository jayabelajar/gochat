'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketClient } from '@/lib/socket';
import {
  Hash,
  Send,
  Smile,
  Pencil,
  Trash2,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export const ChatArea: React.FC = () => {
  const {
    activeServerId,
    channels,
    activeChannelId,
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    typingUsers,
    activeConversationId,
    conversations,
    directMessages,
    sendDirectMessage,
  } = useChatStore();

  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const currentMessages = activeChannelId ? messages[activeChannelId] || [] : [];

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const currentDMs = activeConversationId ? directMessages[activeConversationId] || [] : [];

  const otherMember = activeConv?.members?.find((m) => m.user_id !== user?.id)?.user;
  const dmTitle = activeConv?.name || otherMember?.display_name || otherMember?.username || 'Private Chat';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, currentDMs.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (activeChannelId) {
      socketClient.sendTyping(activeChannelId, true);

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketClient.sendTyping(activeChannelId, false);
      }, 2000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    if (activeChannelId) {
      socketClient.sendTyping(activeChannelId, false);
      await sendMessage(activeChannelId, text);
    } else if (activeConversationId) {
      await sendDirectMessage(activeConversationId, text);
    }
  };

  const handleStartEdit = (id: string, content: string) => {
    setEditingMessageId(id);
    setEditContent(content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await editMessage(id, editContent.trim());
    setEditingMessageId(null);
  };

  const currentTyping = activeChannelId ? (typingUsers[activeChannelId] || []).filter((u) => u !== user?.username) : [];

  if (!activeServerId && !activeConversationId) {
    return (
      <main className="flex-1 bg-[#1A1B1E] flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="w-16 h-16 rounded-full bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#F2F3F5] mb-2">Welcome to GoChat</h2>
        <p className="text-sm text-[#949BA4] max-w-sm">
          Select a community server from the left rail or open a conversation to start chatting in real time.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#1A1B1E] flex flex-col min-w-0 overflow-hidden">
      {/* Top Channel Bar */}
      <div className="h-12 border-b border-[#202225] px-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          {activeChannelId ? (
            <>
              <Hash className="w-5 h-5 text-[#949BA4] shrink-0" />
              <h3 className="font-semibold text-sm text-[#F2F3F5] truncate">
                {activeChannel?.name || 'general'}
              </h3>
              {activeChannel?.topic && (
                <>
                  <span className="text-[#3F4147]">|</span>
                  <span className="text-xs text-[#949BA4] truncate">
                    {activeChannel.topic}
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {dmTitle.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="font-semibold text-sm text-[#F2F3F5] truncate">
                {dmTitle}
              </h3>
            </>
          )}
        </div>
      </div>

      {/* Message History List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome Message at the top */}
        <div className="mb-6 pt-4 border-b border-[#232428] pb-4">
          <div className="w-12 h-12 rounded-full bg-[#232428] flex items-center justify-center text-white mb-2">
            <Hash className="w-6 h-6 text-[#949BA4]" />
          </div>
          <h2 className="text-lg font-bold text-[#F2F3F5]">
            Welcome to #{activeChannel?.name || dmTitle}!
          </h2>
          <p className="text-xs text-[#949BA4]">
            This is the start of the #{activeChannel?.name || dmTitle} space.
          </p>
        </div>

        {/* Channel Messages */}
        {activeChannelId &&
          currentMessages.map((msg) => {
            const isSelf = msg.sender_id === user?.id;
            const isEditing = editingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className="group relative flex space-x-3.5 hover:bg-[#202225]/40 -mx-4 px-4 py-1.5 rounded transition"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5">
                  {(msg.sender?.display_name || msg.sender?.username || 'U')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-semibold text-[#F2F3F5] hover:underline cursor-pointer">
                      {msg.sender?.display_name || msg.sender?.username || 'User'}
                    </span>
                    <span className="text-[10px] text-[#949BA4]">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 bg-[#2B2D31] text-[#F2F3F5] text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="p-1.5 bg-[#5865F2] text-white rounded hover:bg-[#4752C4]"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="p-1.5 bg-[#2B2D31] text-[#949BA4] rounded hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-[#DBDEE1] break-words whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                      {msg.is_edited && (
                        <span className="text-[10px] text-[#949BA4] ml-1.5">(edited)</span>
                      )}
                    </p>
                  )}

                  {/* Reaction chips */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji) => {
                        const count = msg.reactions?.filter((r) => r.emoji === emoji).length || 0;
                        return (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#2B2D31] hover:bg-[#35373C] text-xs text-[#F2F3F5] border border-[#3F4147]"
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Floating Action Menu */}
                <div className="opacity-0 group-hover:opacity-100 absolute right-4 -top-3 bg-[#2B2D31] border border-[#232428] rounded-md shadow flex items-center space-x-1 px-1 py-0.5 transition z-10">
                  {['👍', '❤️', '🔥', '🎉'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(msg.id, emoji)}
                      className="p-1 hover:bg-[#35373C] rounded text-sm transition"
                    >
                      {emoji}
                    </button>
                  ))}
                  {isSelf && (
                    <>
                      <button
                        onClick={() => handleStartEdit(msg.id, msg.content)}
                        className="p-1 hover:bg-[#35373C] rounded text-[#949BA4] hover:text-white transition"
                        title="Edit Message"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-1 hover:bg-[#35373C] rounded text-[#949BA4] hover:text-[#F23F43] transition"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

        {/* Direct Messages */}
        {activeConversationId &&
          currentDMs.map((dm) => (
            <div
              key={dm.id}
              className="flex space-x-3.5 hover:bg-[#202225]/40 -mx-4 px-4 py-1.5 rounded transition"
            >
              <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5">
                {(dm.sender?.display_name || dm.sender?.username || 'U')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2">
                  <span className="text-sm font-semibold text-[#F2F3F5]">
                    {dm.sender?.display_name || dm.sender?.username || 'User'}
                  </span>
                  <span className="text-[10px] text-[#949BA4]">
                    {new Date(dm.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-[#DBDEE1] break-words whitespace-pre-wrap leading-relaxed">
                  {dm.content}
                </p>
              </div>
            </div>
          ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {currentTyping.length > 0 && (
        <div className="px-4 py-1 text-xs text-[#949BA4] italic flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 bg-[#5865F2] rounded-full animate-pulse" />
          <span>
            {currentTyping.join(', ')} {currentTyping.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="px-4 pb-4 pt-1">
        <form
          onSubmit={handleSendMessage}
          className="bg-[#2B2D31] rounded-lg flex items-center px-4 py-2.5 space-x-3 shadow-inner"
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={
              activeChannelId
                ? `Message #${activeChannel?.name || 'general'}`
                : `Message @${dmTitle}`
            }
            className="flex-1 bg-transparent text-sm text-[#F2F3F5] placeholder-[#949BA4] focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1.5 rounded-full bg-[#5865F2] text-white hover:bg-[#4752C4] disabled:opacity-40 disabled:hover:bg-[#5865F2] transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </main>
  );
};

