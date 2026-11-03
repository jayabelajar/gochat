export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string;
  status: PresenceStatus;
  last_seen_at?: string;
  created_at: string;
}

export interface Role {
  id: string;
  server_id: string;
  name: string;
  color: string;
  position: number;
  is_default: boolean;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  nickname?: string;
  role_id?: string;
  joined_at: string;
  user?: User;
  role?: Role;
}

export interface Channel {
  id: string;
  server_id: string;
  category_id?: string | null;
  name: string;
  topic?: string;
  type: 'text' | 'voice';
  position: number;
  is_private: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  server_id: string;
  name: string;
  position: number;
  channels?: Channel[];
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon_url?: string | null;
  owner_id: string;
  invite_code: string;
  member_count?: number;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  user?: {
    username: string;
    display_name: string;
  };
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  reply_to_id?: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: User;
  reply_to?: ChannelMessage;
  reactions?: MessageReaction[];
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string | null;
  icon_url?: string | null;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
  members?: {
    conversation_id: string;
    user_id: string;
    user?: User;
  }[];
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  reply_to_id?: string | null;
  is_edited: boolean;
  created_at: string;
  sender?: User;
}

export interface WSEvent<T = any> {
  event: string;
  data: T;
}

