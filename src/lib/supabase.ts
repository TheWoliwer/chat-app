import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 5
    }
  }
});

// Tip tanımlamaları
export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
  participants?: Profile[];
  last_message?: Message;
};

export type Message = {
  id: string;
  conversation_id: string;
  profile_id: string;
  content: string;
  read: boolean;
  created_at: string;
  profile?: Profile;
};