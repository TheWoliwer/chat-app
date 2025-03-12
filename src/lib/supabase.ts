import { createClient } from '@supabase/supabase-js';

// Çevre değişkenlerini kontrol et
const isServer = typeof window === 'undefined';

// Çevre değişkenlerini güvenli bir şekilde al
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL bulunamadı! Lütfen .env dosyanızı kontrol edin.');
    return 'https://placeholder-url.supabase.co'; // Hata durumunda placeholder URL
  }
  return url;
};

const getSupabaseKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.');
    return 'placeholder-key'; // Hata durumunda placeholder key
  }
  return key;
};

export const supabaseUrl = getSupabaseUrl();
export const supabaseKey = getSupabaseKey();

// Client tarafında hata yönetimi ile Supabase client'ını oluştur
let supabaseInstance: ReturnType<typeof createClient>;

export const supabase = (() => {
  try {
    if (supabaseInstance) return supabaseInstance;
    
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 5
        }
      }
    });
    
    return supabaseInstance;
  } catch (error) {
    console.error('Supabase client oluşturulurken hata:', error);
    
    // Hata durumunda varsayılan bir client dön
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
      }
    });
  }
})();

// Tip tanımlamaları
export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
  online_status?: boolean;
  last_seen_at?: string;
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
  reply_to_message_id?: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
};