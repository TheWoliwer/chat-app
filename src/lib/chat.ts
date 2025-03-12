import { supabase, Conversation, Message, Profile } from './supabase';

// Yeni konuşma başlatma
export async function createConversation(participantIds: string[]) {
  try {
    // Önce yeni bir konuşma oluştur
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (conversationError) throw conversationError;

    // Ardından katılımcıları ekle
    const participantsToInsert = participantIds.map(profileId => ({
      conversation_id: conversationData.id,
      profile_id: profileId
    }));

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantsToInsert);

    if (participantsError) throw participantsError;

    return { success: true, conversation: conversationData };
  } catch (error) {
    console.error('Konuşma oluşturulurken hata:', error);
    return { success: false, error };
  }
}

// Kullanıcının tüm konuşmalarını getirme
export async function getUserConversations(userId: string) {
  try {
    // Önce kullanıcının katıldığı konuşma ID'lerini al
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', userId);

    if (participantError) throw participantError;

    if (!participantData || participantData.length === 0) {
      return { conversations: [] };
    }

    const conversationIds = participantData.map(p => p.conversation_id);

    // Konuşmaları getir
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (conversationsError) throw conversationsError;

    // Her konuşma için katılımcıları ve son mesajı al
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        // Katılımcıları al
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('profile_id, profiles:profile_id(*)')
          .eq('conversation_id', conversation.id);

        // Son mesajı al
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conversation,
          participants: participants?.map(p => p.profiles),
          last_message: lastMessage
        };
      })
    );

    return { conversations: conversationsWithDetails };
  } catch (error) {
    console.error('Konuşmalar getirilirken hata:', error);
    return { conversations: [], error };
  }
}

// Belirli bir konuşmanın mesajlarını getirme
export async function getConversationMessages(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profile:profile_id (
          id, username, avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { messages: data };
  } catch (error) {
    console.error('Mesajlar getirilirken hata:', error);
    return { messages: [], error };
  }
}

// Mesaj gönderme
export async function sendMessage(conversationId: string, profileId: string, content: string) {
  try {
    // Mesajı ekle
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        profile_id: profileId,
        content
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Konuşmanın updated_at zamanını güncelle
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    return { success: true, message };
  } catch (error) {
    console.error('Mesaj gönderilirken hata:', error);
    return { success: false, error };
  }
}

// Tüm kullanıcıları arama
export async function searchUsers(query: string, currentUserId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    return { users: data };
  } catch (error) {
    console.error('Kullanıcılar aranırken hata:', error);
    return { users: [], error };
  }
}

// Gerçek zamanlı mesaj aboneliği
export function subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const newMessage = payload.new as Message;
        
        // Mesajın profil bilgilerini al
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newMessage.profile_id)
          .single();
          
        callback({ ...newMessage, profile: profile as unknown as Profile });
      }
    )
    .subscribe();
}