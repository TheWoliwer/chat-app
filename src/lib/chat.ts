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

    // Her konuşma için katılımcıları ve son mesajı ayrı ayrı al
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        // Katılımcı ID'lerini getir
        const { data: participantsData } = await supabase
          .from('conversation_participants')
          .select('profile_id')
          .eq('conversation_id', conversation.id);
          
        // Bu ID'leri kullanarak profilleri getir
        let participants = [];
        if (participantsData && participantsData.length > 0) {
          const profileIds = participantsData.map(p => p.profile_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', profileIds);
            
          participants = profilesData || [];
        }

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
          participants,
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

// Dosya yükleme işlemi
export async function uploadFile(file: File, userId: string) {
  try {
    // Benzersiz bir dosya adı oluştur
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Dosyayı yükle
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (error) throw error;

    // Yüklenen dosya için genel URL oluştur
    const { data: urlData } = await supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return { 
      success: true, 
      url: urlData.publicUrl, 
      fileType: file.type, 
      fileName: file.name 
    };
  } catch (error) {
    console.error('Dosya yüklenirken hata:', error);
    return { success: false, error };
  }
}

// Dosya ile birlikte mesaj gönderme
export async function sendMessageWithAttachment(
  conversationId: string, 
  profileId: string, 
  content: string,
  attachmentUrl: string,
  attachmentType: string,
  attachmentName: string
) {
  try {
    // Mesajı ekle
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        profile_id: profileId,
        content,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        attachment_name: attachmentName
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
    console.error('Dosyalı mesaj gönderilirken hata:', error);
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
        
        // Mesajın profil bilgilerini ayrı bir sorgu ile al
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', newMessage.profile_id)
          .single();
          
        callback({ ...newMessage, profile: profile as Profile });
      }
    )
    .subscribe();
}

// Yazma durumunu paylaşma ve dinleme
export async function updateTypingStatus(conversationId: string, profileId: string, isTyping: boolean) {
  try {
    // Gerçek zamanlı olarak "typing_status" kanalına mesaj gönderiyoruz
    await supabase
      .channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          profile_id: profileId,
          is_typing: isTyping,
          conversation_id: conversationId
        }
      });
    
    return { success: true };
  } catch (error) {
    console.error('Yazma durumu güncellenirken hata:', error);
    return { success: false, error };
  }
}

// Yazma durumunu dinlemek için
export function subscribeToTypingStatus(conversationId: string, callback: (status: {profile_id: string, is_typing: boolean}) => void) {
  return supabase
    .channel(`typing:${conversationId}`)
    .on('broadcast', { event: 'typing' }, (payload) => {
      callback(payload.payload);
    })
    .subscribe();
}

// Mesajın okundu durumunu güncelleme
export async function markMessageAsRead(messageId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Mesaj okundu olarak işaretlenirken hata:', error);
    return { success: false, error };
  }
}

// Konuşmadaki tüm mesajları okundu olarak işaretle
export async function markAllConversationMessagesAsRead(conversationId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('profile_id', userId) // Kendi mesajlarımızı hariç tut
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Konuşma mesajları okundu olarak işaretlenirken hata:', error);
    return { success: false, error };
  }
}

// Okunmamış mesaj sayısını getir
export async function getUnreadMessagesCount(conversationId: string, userId: string) {
  try {
    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .neq('profile_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true, count };
  } catch (error) {
    console.error('Okunmamış mesaj sayısı alınırken hata:', error);
    return { success: false, error, count: 0 };
  }
}

// Mesaja yanıt verme fonksiyonu
export async function replyToMessage(conversationId: string, profileId: string, content: string, replyToMessageId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        profile_id: profileId,
        content,
        reply_to_message_id: replyToMessageId
      })
      .select()
      .single();

    if (error) throw error;

    // Konuşma güncelleme zamanını da güncelleyelim
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { success: true, message: data };
  } catch (error) {
    console.error('Mesaja yanıt verilirken hata:', error);
    return { success: false, error };
  }
}

// Yanıtlanan mesajın bilgilerini getir
export async function getReplyMessage(messageId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profile:profile_id (id, username, full_name, avatar_url)
      `)
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return { success: true, message: data };
  } catch (error) {
    console.error('Yanıtlanan mesaj getirilirken hata:', error);
    return { success: false, error };
  }
}

// Çevrimiçi durumunu güncelleme
export async function updateOnlineStatus(profileId: string, isOnline: boolean) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        online_status: isOnline,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Çevrimiçi durumu güncellenirken hata:', error);
    return { success: false, error };
  }
}

// Çevrimiçi durumlarını dinleme
export function subscribeToOnlineStatus(profileIds: string[], callback: (status: {profile_id: string, online_status: boolean, last_seen_at: string}) => void) {
  return supabase
    .channel('online-status')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=in.(${profileIds.join(',')})`,
      },
      (payload) => {
        callback({
          profile_id: payload.new.id,
          online_status: payload.new.online_status,
          last_seen_at: payload.new.last_seen_at
        });
      }
    )
    .subscribe();
}