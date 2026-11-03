'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { socketClient } from '@/lib/socket';
import { apiRequest } from '@/lib/api';
import { PresenceStatus, Server, Channel, ChannelMessage, ServerMember } from '@/types';
import {
  Terminal,
  Hash,
  Plus,
  ChevronDown,
  Menu,
  X,
  Search,
  Sparkles,
  Pin,
  Users,
  FileCode,
  Trash2,
  SendHorizontal,
  Mic,
  Headphones,
  Settings,
  Bell,
  LogOut,
  Pencil,
  PhoneOff,
  Check,
  Compass,
} from 'lucide-react';
import { CreateServerModal } from '@/components/modals/CreateServerModal';
import { JoinServerModal } from '@/components/modals/JoinServerModal';
import { CreateChannelModal } from '@/components/modals/CreateChannelModal';

export default function AppPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth, setUserStatus, logout } = useAuthStore();
  const {
    servers,
    activeServerId,
    setActiveServer,
    fetchServers,
    channels,
    activeChannelId,
    setActiveChannel,
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    members,
    typingUsers,
    presenceMap,
    initSocketListeners,
  } = useChatStore();

  // Drawers and popovers state
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [memberSidebarOpen, setMemberSidebarOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  // Message composer
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Modals
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isJoinServerOpen, setIsJoinServerOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      initSocketListeners();
      fetchServers();
    }
  }, [isAuthenticated, initSocketListeners, fetchServers]);

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeServer = servers.find((s) => s.id === activeServerId);
  const channelMessages = activeChannelId ? messages[activeChannelId] || [] : [];

  // Filter messages by search query if any
  const displayedMessages = searchQuery.trim()
    ? channelMessages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : channelMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (activeChannelId) {
      socketClient.sendTyping(activeChannelId, true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketClient.sendTyping(activeChannelId, false);
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !attachedFile) return;

    let finalContent = inputText.trim();
    if (attachedFile) {
      finalContent = `${finalContent ? finalContent + '\n\n' : ''}\`\`\`go\n// Lampiran: ${attachedFile}\npackage main\n\nfunc main() {\n    println("Worker pool executed successfully.")\n}\n\`\`\``;
      setAttachedFile(null);
    }

    setInputText('');
    if (activeChannelId) {
      socketClient.sendTyping(activeChannelId, false);
      await sendMessage(activeChannelId, finalContent);
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editContent.trim()) return;
    await editMessage(msgId, editContent.trim());
    setEditingId(null);
  };

  const simulateIncomingMessage = () => {
    if (!activeChannelId) return;
    const mocks = [
      'Testing WebSocket latency dari node Singapore: P99 terukur 12ms! ⚡',
      'Sudah merge PR refactor repository layer, sekarang support zero-allocation pgxpool.',
      'Worker pool benchmark selesai dengan 50.000 concurrent goroutines tanpa deadlock! 🚀',
    ];
    const randomMsg = mocks[Math.floor(Math.random() * mocks.length)];
    sendMessage(activeChannelId, randomMsg);
    showToast('Pesan simulasi terkirim via channel!');
  };

  const attachSampleSnippet = () => {
    setAttachedFile('worker_pool_benchmark.go');
    showToast('File snippet dilampirkan!');
  };

  const statusColorMap: Record<PresenceStatus, string> = {
    online: 'bg-[#23A55A]',
    idle: 'bg-[#F0B232]',
    dnd: 'bg-[#F23F43]',
    offline: 'bg-[#80848E]',
  };

  const currentTyping = activeChannelId
    ? (typingUsers[activeChannelId] || []).filter((u) => u !== user?.username)
    : [];

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#111214] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#949BA4] font-medium font-mono">Connecting to GoChat...</span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen w-screen overflow-hidden select-none bg-[#111214] text-[#F2F3F5] flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#2B2D31] border border-[#26282D] text-xs text-[#F2F3F5] px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-[#5865F2]"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {(leftDrawerOpen || memberSidebarOpen) && (
        <div
          className="fixed inset-0 bg-black/65 z-30 transition-opacity"
          onClick={() => {
            setLeftDrawerOpen(false);
            setMemberSidebarOpen(false);
          }}
        />
      )}

      {/* Main Shell */}
      <div className="relative flex flex-1 w-full h-full overflow-hidden">
        {/* LEFT WRAPPER (Server Sidebar + Channel Sidebar) */}
        <div
          className={`fixed lg:static inset-y-0 left-0 z-40 flex h-full transform transition-transform duration-200 ease-out shrink-0 ${
            leftDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* 1. SERVER SIDEBAR */}
          <nav className="w-[72px] h-full bg-[#111214] border-r border-[#26282D] flex flex-col items-center py-3 gap-2 shrink-0 z-20">
            {/* GoChat Brand / Home Button */}
            <div className="relative group flex items-center justify-center w-full">
              <div
                className={`server-pill absolute left-0 w-1 bg-white rounded-r-full transition-all ${
                  activeServerId === null ? 'h-10' : 'h-0 group-hover:h-5'
                }`}
              />
              <button
                onClick={() => {
                  setActiveServer(null);
                  setLeftDrawerOpen(false);
                }}
                className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all duration-150 group relative shadow-sm ${
                  activeServerId === null
                    ? 'bg-[#5865F2] text-white'
                    : 'bg-[#2B2D31] hover:bg-[#5865F2] text-[#F2F3F5]'
                }`}
                title="GoChat Direct Messages"
              >
                <Terminal className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="w-8 h-[1px] bg-[#26282D] my-0.5" />

            {/* Server List */}
            <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar py-0.5">
              {servers.map((server) => {
                const isActive = activeServerId === server.id;
                const initials = server.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 3)
                  .toUpperCase();

                return (
                  <div key={server.id} className="relative group flex items-center justify-center w-full">
                    <div
                      className={`server-pill absolute left-0 w-1 bg-white rounded-r-full transition-all ${
                        isActive ? 'h-10' : 'h-0 group-hover:h-5'
                      }`}
                    />
                    <button
                      onClick={() => {
                        setActiveServer(server.id);
                        setLeftDrawerOpen(false);
                      }}
                      title={server.name}
                      className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-150 font-semibold text-xs ${
                        isActive
                          ? 'rounded-[16px] bg-[#5865F2] text-white shadow-md'
                          : 'bg-[#2B2D31] hover:bg-[#5865F2] text-[#F2F3F5]'
                      }`}
                    >
                      {server.icon_url ? (
                        <img src={server.icon_url} alt={server.name} className="w-full h-full object-cover rounded-inherit" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="w-8 h-[1px] bg-[#26282D] my-0.5" />

            {/* Add Server */}
            <button
              onClick={() => setIsCreateServerOpen(true)}
              className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#2B2D31] hover:bg-[#23A55A] text-[#23A55A] hover:text-white flex items-center justify-center transition-all duration-150 shrink-0"
              title="Tambah Komunitas"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Join Server */}
            <button
              onClick={() => setIsJoinServerOpen(true)}
              className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#2B2D31] hover:bg-[#5865F2] text-[#5865F2] hover:text-white flex items-center justify-center transition-all duration-150 shrink-0"
              title="Join Server via Kode"
            >
              <Compass className="w-5 h-5" />
            </button>
          </nav>

          {/* 2. CHANNEL SIDEBAR */}
          <aside className="w-60 h-full bg-[#17181B] border-r border-[#26282D] flex flex-col shrink-0 select-none">
            {/* Header */}
            <header className="h-12 px-4 border-b border-[#26282D] flex items-center justify-between cursor-pointer hover:bg-[#2B2D31]/40 transition-colors shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-[15px] tracking-tight text-[#F2F3F5] truncate">
                  {activeServer ? activeServer.name : 'Direct Messages'}
                </span>
                {activeServer && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#5865F2]/15 text-[#5865F2] rounded border border-[#5865F2]/25">
                    {activeServer.invite_code}
                  </span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-[#949BA4] shrink-0" />
            </header>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
              {activeServer ? (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#949BA4] px-2 mb-1">
                    <span className="tracking-wider text-[11px]">TEXT CHANNELS</span>
                    <button
                      onClick={() => setIsCreateChannelOpen(true)}
                      className="hover:text-white transition"
                      title="Tambah Channel"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {channels.map((ch) => {
                      const isActive = activeChannelId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => {
                            setActiveChannel(ch.id);
                            setLeftDrawerOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                            isActive
                              ? 'bg-[#2B2D31] text-white'
                              : 'text-[#949BA4] hover:bg-[#2B2D31]/50 hover:text-[#F2F3F5]'
                          }`}
                        >
                          <Hash className="w-4 h-4 shrink-0 text-[#949BA4]" />
                          <span className="truncate">{ch.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-xs text-[#949BA4] text-center">
                  Pilih server komunitas dari rel sebelah kiri atau buat server baru.
                </div>
              )}
            </div>

            {/* Voice Status Panel */}
            {voiceConnected && (
              <div className="px-3 py-2 bg-[#131417] border-t border-[#26282D] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#23A55A] animate-pulse shrink-0"></span>
                  <div className="truncate">
                    <div className="text-[11px] font-semibold text-[#23A55A] leading-tight">Voice Terhubung</div>
                    <div className="text-[11px] text-[#949BA4] truncate">Daily Standup Voice</div>
                  </div>
                </div>
                <button
                  onClick={() => setVoiceConnected(false)}
                  className="p-1.5 rounded hover:bg-[#2B2D31] text-[#949BA4] hover:text-[#F23F43] transition-colors"
                  title="Putuskan Voice"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* User Profile Bar */}
            <div className="h-[54px] px-2.5 bg-[#131417] border-t border-[#26282D] flex items-center justify-between gap-1 shrink-0 relative">
              <button
                onClick={() => setUserPopoverOpen(!userPopoverOpen)}
                className="flex items-center gap-2.5 p-1 rounded-md hover:bg-[#2B2D31] transition-colors min-w-0 flex-1 text-left"
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-white text-xs">
                    {user?.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#131417] ${
                      statusColorMap[user?.status || 'online']
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[#F2F3F5] leading-tight truncate">
                    {user?.display_name || user?.username}
                  </div>
                  <div className="text-[11px] text-[#949BA4] leading-tight truncate">
                    @{user?.username}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-0.5 shrink-0 text-[#949BA4]">
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={`p-1.5 rounded-md hover:bg-[#2B2D31] transition-colors ${
                    micMuted ? 'text-[#F23F43]' : 'hover:text-[#F2F3F5]'
                  }`}
                  title={micMuted ? 'Unmute' : 'Mute'}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeafened(!deafened)}
                  className={`p-1.5 rounded-md hover:bg-[#2B2D31] transition-colors ${
                    deafened ? 'text-[#F23F43]' : 'hover:text-[#F2F3F5]'
                  }`}
                  title={deafened ? 'Undeafen' : 'Deafen'}
                >
                  <Headphones className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setUserPopoverOpen(!userPopoverOpen)}
                  className="p-1.5 rounded-md hover:bg-[#2B2D31] hover:text-[#F2F3F5] transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* 3. MAIN CHAT AREA */}
        <main className="flex-1 h-full bg-[#222327] flex flex-col min-w-0 relative z-10">
          {/* Channel Header */}
          <header className="h-12 px-3 sm:px-4 border-b border-[#26282D] bg-[#222327] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => setLeftDrawerOpen(true)}
                className="lg:hidden p-1.5 -ml-1 rounded-md hover:bg-[#2B2D31] text-[#949BA4] hover:text-[#F2F3F5] transition-colors shrink-0"
                aria-label="Buka Menu Navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                <Hash className="w-5 h-5 text-[#949BA4] shrink-0" />
                <h1 className="font-semibold text-[15px] text-[#F2F3F5] tracking-tight truncate">
                  {activeChannel ? activeChannel.name : 'pilih-channel'}
                </h1>
              </div>

              {activeChannel?.topic && (
                <>
                  <span className="hidden md:inline-block w-[1px] h-4 bg-[#26282D] mx-2 shrink-0" />
                  <p className="hidden md:block text-xs text-[#949BA4] truncate">
                    {activeChannel.topic}
                  </p>
                </>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Cari pesan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 sm:w-44 md:w-56 focus:w-48 sm:focus:w-64 h-7 pl-2.5 pr-7 rounded-md bg-[#111214] border border-[#26282D] focus:border-[#5865F2] text-xs text-[#F2F3F5] placeholder-[#949BA4] outline-none transition-all duration-150 select-text"
                />
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 text-[#949BA4] hover:text-[#F2F3F5]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Search className="w-3.5 h-3.5 text-[#949BA4] absolute right-2.5 pointer-events-none" />
                )}
              </div>

              <button
                onClick={simulateIncomingMessage}
                className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-[#2B2D31] hover:bg-[#32353B] border border-[#26282D] text-xs font-medium text-[#949BA4] hover:text-[#F2F3F5] transition-colors"
                title="Simulasi pesan chat masuk"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#5865F2]" />
                <span>Simulasi Chat</span>
              </button>

              <button
                onClick={() => setMemberSidebarOpen(!memberSidebarOpen)}
                className="p-1.5 rounded-md bg-[#2B2D31] text-[#F2F3F5] hover:bg-[#32353B] transition-colors"
                title="Toggle Member Sidebar"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Search Filter Banner */}
          {searchQuery && (
            <div className="px-4 py-1.5 bg-[#2B2D31]/90 border-b border-[#26282D] flex items-center justify-between text-xs">
              <span className="text-[#949BA4]">
                Hasil pencarian untuk <strong className="text-[#F2F3F5]">"{searchQuery}"</strong> ({displayedMessages.length} pesan ditemukan)
              </span>
              <button onClick={() => setSearchQuery('')} className="text-[#5865F2] hover:underline font-medium">
                Reset
              </button>
            </div>
          )}

          {/* Messages Timeline */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 select-text">
            {/* Welcome Channel Banner */}
            <div className="mb-4 pt-2 border-b border-[#26282D] pb-3">
              <div className="w-10 h-10 rounded-full bg-[#2B2D31] flex items-center justify-center text-white mb-2">
                <Hash className="w-5 h-5 text-[#949BA4]" />
              </div>
              <h2 className="text-base font-bold text-[#F2F3F5]">
                Selamat datang di #{activeChannel?.name || 'general'}!
              </h2>
              <p className="text-xs text-[#949BA4]">
                Ini adalah awal percakapan di #{activeChannel?.name || 'general'}.
              </p>
            </div>

            {/* Message List */}
            {displayedMessages.map((msg) => {
              const isSelf = msg.sender_id === user?.id;
              const isEditing = editingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className="group relative flex space-x-3.5 hover:bg-[#202225]/40 -mx-3 sm:-mx-5 px-3 sm:px-5 py-1.5 rounded transition"
                >
                  <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-semibold shrink-0 mt-0.5">
                    {(msg.sender?.display_name || msg.sender?.username || 'U').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xs font-semibold text-[#F2F3F5] hover:underline cursor-pointer">
                        {msg.sender?.display_name || msg.sender?.username || 'User'}
                      </span>
                      <span className="text-[10px] text-[#949BA4]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 bg-[#2B2D31] text-xs text-[#F2F3F5] rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(msg.id)}
                          className="p-1.5 bg-[#5865F2] text-white rounded text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-[#2B2D31] text-[#949BA4] rounded text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-[#DBDEE1] break-words whitespace-pre-wrap leading-relaxed mt-0.5">
                        {msg.content}
                        {msg.is_edited && <span className="text-[10px] text-[#949BA4] ml-1.5">(diedit)</span>}
                      </div>
                    )}
                  </div>

                  {/* Message Action Bar */}
                  <div className="opacity-0 group-hover:opacity-100 absolute right-3 -top-2.5 bg-[#2B2D31] border border-[#26282D] rounded-md shadow px-1 py-0.5 flex items-center gap-1 z-10">
                    {['🚀', '🔥', '👍'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(msg.id, emoji)}
                        className="p-1 hover:bg-[#32353B] rounded text-xs"
                      >
                        {emoji}
                      </button>
                    ))}
                    {isSelf && (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(msg.id);
                            setEditContent(msg.content);
                          }}
                          className="p-1 hover:bg-[#32353B] text-[#949BA4] hover:text-white rounded"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1 hover:bg-[#32353B] text-[#949BA4] hover:text-[#F23F43] rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          <div className="h-6 px-4 sm:px-5 flex items-center shrink-0">
            {currentTyping.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[#949BA4]">
                <div className="flex items-center gap-0.5 bg-[#2B2D31] px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#949BA4] typing-dot"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#949BA4] typing-dot"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#949BA4] typing-dot"></span>
                </div>
                <span>
                  <strong className="text-[#F2F3F5] font-medium">{currentTyping.join(', ')}</strong> sedang mengetik...
                </span>
              </div>
            )}
          </div>

          {/* Message Composer Area */}
          <div className="px-3 sm:px-4 pb-3.5 pt-0.5 shrink-0">
            {/* Attachment Preview Strip */}
            {attachedFile && (
              <div className="mb-2 p-2.5 rounded-t-lg bg-[#2B2D31] border border-b-0 border-[#26282D] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2] shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#F2F3F5] truncate">{attachedFile}</div>
                    <div className="text-[11px] text-[#949BA4]">Kode Go snippet • Siap dikirim</div>
                  </div>
                </div>
                <button onClick={() => setAttachedFile(null)} className="p-1 rounded hover:bg-[#222327] text-[#949BA4] hover:text-[#F23F43]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Composer Box */}
            <div className="bg-[#2B2D31] rounded-lg border border-[#26282D] focus-within:border-[#5865F2]/70 transition-colors flex items-end px-3 py-2 gap-2">
              <button
                onClick={attachSampleSnippet}
                className="p-1.5 rounded-md hover:bg-[#32353B] text-[#949BA4] hover:text-[#F2F3F5] transition-colors shrink-0 mb-0.5"
                title="Lampirkan Snippet Kode"
              >
                <Plus className="w-4 h-4" />
              </button>

              <textarea
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Kirim pesan ke #${activeChannel ? activeChannel.name : 'general'}`}
                className="flex-1 bg-transparent text-xs text-[#F2F3F5] placeholder-[#949BA4] outline-none max-h-36 py-1 leading-relaxed select-text overflow-y-auto"
              />

              <div className="flex items-center gap-1 shrink-0 mb-0.5">
                <button
                  onClick={() => setInputText((prev) => prev + ' 🚀')}
                  className="hidden sm:flex p-1 rounded hover:bg-[#32353B] text-xs"
                >
                  🚀
                </button>
                <button
                  onClick={() => setInputText((prev) => prev + ' 🔥')}
                  className="hidden sm:flex p-1 rounded hover:bg-[#32353B] text-xs"
                >
                  🔥
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() && !attachedFile}
                  className="h-7 px-3 rounded-md bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Kirim</span>
                  <SendHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-between mt-1 px-1 text-[11px] text-[#949BA4]">
              <div>
                Tekan <kbd className="px-1 py-0.5 bg-[#17181B] border border-[#26282D] rounded font-mono text-[10px] text-[#F2F3F5]">Enter</kbd> untuk kirim, <kbd className="px-1 py-0.5 bg-[#17181B] border border-[#26282D] rounded font-mono text-[10px] text-[#F2F3F5]">Shift + Enter</kbd> baris baru
              </div>
              <span>Markdown didukung</span>
            </div>
          </div>
        </main>

        {/* 4. MEMBER SIDEBAR */}
        <aside
          className={`fixed xl:static inset-y-0 right-0 z-40 w-60 h-full bg-[#17181B] border-l border-[#26282D] flex flex-col shrink-0 select-none transform transition-transform duration-200 ease-out ${
            memberSidebarOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
          }`}
        >
          <div className="h-12 px-4 border-b border-[#26282D] flex items-center justify-between xl:hidden shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#949BA4]">Anggota Komunitas</span>
            <button onClick={() => setMemberSidebarOpen(false)} className="p-1 rounded hover:bg-[#2B2D31] text-[#949BA4] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-[#949BA4] tracking-wider px-2 mb-2">
                ANGGOTA KOMUNITAS — {members.length}
              </h3>
              <div className="space-y-1">
                {members.map((m) => {
                  const status = (presenceMap[m.user_id] || m.user?.status || 'online') as PresenceStatus;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-[#2B2D31] cursor-pointer transition"
                    >
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-white text-xs">
                          {(m.nickname || m.user?.display_name || m.user?.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#17181B] ${
                            statusColorMap[status] || statusColorMap.offline
                          }`}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-[#F2F3F5] truncate">
                          {m.nickname || m.user?.display_name || m.user?.username}
                        </span>
                        {m.role && <span className="text-[10px] text-[#949BA4]">{m.role.name}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* USER PROFILE POPOVER */}
      {userPopoverOpen && (
        <div className="fixed bottom-16 left-4 sm:left-20 z-50 w-72 rounded-xl bg-[#111214] border border-[#26282D] shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100">
          <div className="h-14 bg-[#1E212B] border-b border-[#26282D] relative flex items-center justify-end px-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#2B2D31] text-[#949BA4] border border-[#26282D]">
              ENGINEER
            </span>
          </div>

          <div className="px-4 pb-4 pt-6 relative">
            <div className="mb-3">
              <div className="font-bold text-base text-[#F2F3F5]">{user?.display_name || user?.username}</div>
              <div className="text-xs text-[#949BA4] font-mono">@{user?.username} • Golang &amp; TypeScript</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#17181B] border border-[#26282D] space-y-2 mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#949BA4]">Ubah Status Kehadiran</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['online', 'idle', 'dnd', 'offline'] as PresenceStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setUserStatus(st);
                      setUserPopoverOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#2B2D31]/60 hover:bg-[#2B2D31] text-xs text-[#F2F3F5] transition"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${statusColorMap[st]}`} />
                    <span className="capitalize">{st === 'dnd' ? 'Do Not Disturb' : st}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setUserPopoverOpen(false);
                logout();
              }}
              className="w-full py-2 rounded-lg bg-[#F23F43]/15 hover:bg-[#F23F43]/25 border border-[#F23F43]/30 text-xs font-semibold text-[#F23F43] flex items-center justify-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateServerModal isOpen={isCreateServerOpen} onClose={() => setIsCreateServerOpen(false)} />
      <JoinServerModal isOpen={isJoinServerOpen} onClose={() => setIsJoinServerOpen(false)} />
      <CreateChannelModal isOpen={isCreateChannelOpen} onClose={() => setIsCreateChannelOpen(false)} />
    </div>
  );
}
