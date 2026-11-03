import { create } from 'zustand';
import { Server, Channel, ChannelMessage, ServerMember, Conversation, DirectMessage } from '@/types';
import { apiRequest } from '@/lib/api';
import { socketClient } from '@/lib/socket';

interface ChatState {
  // Navigation
  servers: Server[];
  activeServerId: string | null;
  channels: Channel[];
  activeChannelId: string | null;
  conversations: Conversation[];
  activeConversationId: string | null;

  // Messages & Members
  messages: Record<string, ChannelMessage[]>; // channelId -> messages
  directMessages: Record<string, DirectMessage[]>; // convId -> direct messages
  members: ServerMember[];
  typingUsers: Record<string, string[]>; // channelId -> usernames
  presenceMap: Record<string, string>; // userId -> presence status

  // Actions
  fetchServers: () => Promise<void>;
  setActiveServer: (serverId: string | null) => Promise<void>;
  fetchChannels: (serverId: string) => Promise<void>;
  setActiveChannel: (channelId: string | null) => Promise<void>;
  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;

  // Direct messaging actions
  fetchConversations: () => Promise<void>;
  setActiveConversation: (convId: string | null) => Promise<void>;
  sendDirectMessage: (convId: string, content: string) => Promise<void>;

  // Real-time Event Handlers
  handleIncomingMessage: (msg: ChannelMessage) => void;
  handleMessageUpdate: (msg: ChannelMessage) => void;
  handleMessageDelete: (messageId: string) => void;
  handleTypingEvent: (channelId: string, username: string, isTyping: boolean) => void;
  handlePresenceEvent: (userId: string, status: string) => void;
  initSocketListeners: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  servers: [],
  activeServerId: null,
  channels: [],
  activeChannelId: null,
  conversations: [],
  activeConversationId: null,
  messages: {},
  directMessages: {},
  members: [],
  typingUsers: {},
  presenceMap: {},

  fetchServers: async () => {
    try {
      const servers = await apiRequest<Server[]>('/servers');
      set({ servers });
    } catch (err) {
      console.error('Failed to load servers', err);
    }
  },

  setActiveServer: async (serverId) => {
    set({ activeServerId: serverId, activeConversationId: null });
    if (serverId) {
      await get().fetchChannels(serverId);
      try {
        const members = await apiRequest<ServerMember[]>(`/servers/${serverId}/members`);
        set({ members });
      } catch (err) {
        console.error('Failed to load members', err);
      }
    } else {
      set({ channels: [], activeChannelId: null, members: [] });
      await get().fetchConversations();
    }
  },

  fetchChannels: async (serverId) => {
    try {
      const channels = await apiRequest<Channel[]>(`/servers/${serverId}/channels`);
      set({ channels });
      if (channels.length > 0 && !get().activeChannelId) {
        get().setActiveChannel(channels[0].id);
      }
    } catch (err) {
      console.error('Failed to load channels', err);
    }
  },

  setActiveChannel: async (channelId) => {
    const prevChannelId = get().activeChannelId;
    if (prevChannelId) {
      socketClient.unsubscribeFromChannel(prevChannelId);
    }

    set({ activeChannelId: channelId });
    if (channelId) {
      socketClient.subscribeToChannel(channelId);
      await get().fetchMessages(channelId);
    }
  },

  fetchMessages: async (channelId) => {
    try {
      const msgs = await apiRequest<ChannelMessage[]>(`/channels/${channelId}/messages?limit=50`);
      set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: msgs || [],
        },
      }));
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  },

  sendMessage: async (channelId, content, replyToId) => {
    try {
      const newMsg = await apiRequest<ChannelMessage>(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, reply_to_id: replyToId }),
      });
      get().handleIncomingMessage(newMsg);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  },

  editMessage: async (messageId, content) => {
    try {
      const updated = await apiRequest<ChannelMessage>(`/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      });
      get().handleMessageUpdate(updated);
    } catch (err) {
      console.error('Failed to edit message', err);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await apiRequest(`/messages/${messageId}`, {
        method: 'DELETE',
      });
      get().handleMessageDelete(messageId);
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      await apiRequest(`/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji, is_channel_message: true }),
      });
    } catch (err) {
      console.error('Failed to react', err);
    }
  },

  fetchConversations: async () => {
    try {
      const conversations = await apiRequest<Conversation[]>('/conversations');
      set({ conversations });
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  },

  setActiveConversation: async (convId) => {
    set({ activeConversationId: convId, activeServerId: null, activeChannelId: null });
    if (convId) {
      try {
        const dms = await apiRequest<DirectMessage[]>(`/conversations/${convId}/messages`);
        set((state) => ({
          directMessages: {
            ...state.directMessages,
            [convId]: dms || [],
          },
        }));
      } catch (err) {
        console.error('Failed to fetch direct messages', err);
      }
    }
  },

  sendDirectMessage: async (convId, content) => {
    try {
      const newDM = await apiRequest<DirectMessage>(`/conversations/${convId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      set((state) => ({
        directMessages: {
          ...state.directMessages,
          [convId]: [...(state.directMessages[convId] || []), newDM],
        },
      }));
    } catch (err) {
      console.error('Failed to send direct message', err);
    }
  },

  handleIncomingMessage: (msg) => {
    set((state) => {
      const channelMsgs = state.messages[msg.channel_id] || [];
      if (channelMsgs.some((m) => m.id === msg.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [msg.channel_id]: [...channelMsgs, msg],
        },
      };
    });
  },

  handleMessageUpdate: (msg) => {
    set((state) => {
      const channelMsgs = state.messages[msg.channel_id] || [];
      return {
        messages: {
          ...state.messages,
          [msg.channel_id]: channelMsgs.map((m) => (m.id === msg.id ? msg : m)),
        },
      };
    });
  },

  handleMessageDelete: (messageId) => {
    set((state) => {
      const updatedMessages: Record<string, ChannelMessage[]> = {};
      for (const [chId, msgs] of Object.entries(state.messages)) {
        updatedMessages[chId] = msgs.filter((m) => m.id !== messageId);
      }
      return { messages: updatedMessages };
    });
  },

  handleTypingEvent: (channelId, username, isTyping) => {
    set((state) => {
      const current = state.typingUsers[channelId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, username]))
        : current.filter((u) => u !== username);
      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: updated,
        },
      };
    });
  },

  handlePresenceEvent: (userId, status) => {
    set((state) => ({
      presenceMap: {
        ...state.presenceMap,
        [userId]: status,
      },
    }));
  },

  initSocketListeners: () => {
    socketClient.on('message.create', (msg: ChannelMessage) => {
      get().handleIncomingMessage(msg);
    });

    socketClient.on('message.update', (msg: ChannelMessage) => {
      get().handleMessageUpdate(msg);
    });

    socketClient.on('message.delete', (data: { id: string }) => {
      get().handleMessageDelete(data.id);
    });

    socketClient.on('typing.start', (data: { channel_id: string; username: string }) => {
      if (data.channel_id && data.username) {
        get().handleTypingEvent(data.channel_id, data.username, true);
      }
    });

    socketClient.on('typing.stop', (data: { channel_id: string; username: string }) => {
      if (data.channel_id && data.username) {
        get().handleTypingEvent(data.channel_id, data.username, false);
      }
    });

    socketClient.on('presence.online', (data: { user_id: string }) => {
      get().handlePresenceEvent(data.user_id, 'online');
    });

    socketClient.on('presence.offline', (data: { user_id: string }) => {
      get().handlePresenceEvent(data.user_id, 'offline');
    });
  },
}));

