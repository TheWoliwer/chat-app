import { supabase } from './supabase';
import { sendEmailNotification } from './email';  // E-posta gönderimi için bir servis oluşturmanız gerekecek

export async function sendNewMessageNotification(messageId: string) {
  try {
    // Mesaj ve ilgili kullanıcı bilgilerini al
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        profile:profile_id (id, username, full_name, email),
        conversation_id
      `)
      .eq('id', messageId)
      .single();

    if (messageError) throw messageError;

    // Konuşmadaki diğer katılımcıları bul
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(`
        profile_id,
        profile:profile_id (id, username, full_name, email, notification_settings)
      `)
      .eq('conversation_id', message.conversation_id)
      .neq('profile_id', message.profile_id);  // Mesajı gönderen kişiye bildirim gönderme

    if (participantsError) throw participantsError;

    // Her katılımcıya e-posta bildirimlerini kontrol et ve gönder
    for (const participant of participants) {
      // Kullanıcının bildirim ayarlarını kontrol et
      const notificationSettings = participant.profile.notification_settings || { email: true };
      
      if (notificationSettings.email) {
        await sendEmailNotification({
          to: participant.profile.email,
          subject: `Yeni mesaj: ${message.profile.username}`,
          body: `${message.profile.username}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${message.conversation_id}`
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Bildirim gönderilirken hata:', error);
    return { success: false, error };
  }
}