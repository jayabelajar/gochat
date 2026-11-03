'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { ServerSidebar } from '@/components/layout/ServerSidebar';
import { ChannelSidebar } from '@/components/layout/ChannelSidebar';
import { ChatArea } from '@/components/layout/ChatArea';
import { MemberSidebar } from '@/components/layout/MemberSidebar';
import { CreateServerModal } from '@/components/modals/CreateServerModal';
import { JoinServerModal } from '@/components/modals/JoinServerModal';
import { CreateChannelModal } from '@/components/modals/CreateChannelModal';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { fetchServers, initSocketListeners } = useChatStore();

  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isJoinServerOpen, setIsJoinServerOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111214] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#949BA4] font-medium">Connecting to GoChat...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111214] select-none">
      {/* 1. Server Sidebar (Rail) */}
      <ServerSidebar
        onOpenCreateServer={() => setIsCreateServerOpen(true)}
        onOpenJoinServer={() => setIsJoinServerOpen(true)}
      />

      {/* 2. Channel / DM Sidebar */}
      <ChannelSidebar
        onOpenCreateChannel={() => setIsCreateChannelOpen(true)}
      />

      {/* 3. Main Chat View */}
      <ChatArea />

      {/* 4. Member Sidebar */}
      <MemberSidebar />

      {/* Modals */}
      <CreateServerModal
        isOpen={isCreateServerOpen}
        onClose={() => setIsCreateServerOpen(false)}
      />
      <JoinServerModal
        isOpen={isJoinServerOpen}
        onClose={() => setIsJoinServerOpen(false)}
      />
      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
      />
    </div>
  );
}
