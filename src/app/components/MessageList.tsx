'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getConversationMessages, subscribeToMessages, subscribeToTypingStatus, markAllConversationMessagesAsRead } from '@/lib/chat';
import { useAuth } from '../context/AuthContext';
import { Message, Profile } from '@/lib/supabase';
import ReplyMessagePreview from './ReplyMessagePreview';

interface MessageListProps {
  conversationId: string;
}

export default function MessageList({ conversationId }: MessageListProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMessages() {
      if (conversationId && user) {
        setLoading(true);
        const { messages } = await getConversationMessages(conversationId);
        setMessages(messages as Message[]);
        
        // Katılımcıları mesajlardan çıkar
        const profileMap = new Map<string, Profile>();
        messages.forEach((message: Message) => {
          if (message.profile && !profileMap.has(message.profile.id)) {
            profileMap.set(message.profile.id, message.profile);
          }
        });
        setParticipants(Array.from(profileMap.values()));
        
        // Tüm mesajları okundu olarak işaretle
        await markAllConversationMessagesAsRead(conversationId, user.id);
        
        setLoading(false);
      }
    }

    loadMessages();

    // Gerçek zamanlı mesaj aboneliği
    const messageSubscription = subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Eğer mesaj bize geliyorsa ve biz göndermediyse, okundu olarak işaretle
      if (newMessage.profile_id !== user?.id && user) {
        markAllConversationMessagesAsRead(conversationId, user.id);
      }
    });

    // Yazma durumu aboneliği
    const typingSubscription = subscribeToTypingStatus(conversationId, (status) => {
      if (status.profile_id !== user?.id) {  // Kendi yazma durumumuzu göstermiyoruz
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          
          if (status.is_typing) {
            newMap.set(status.profile_id, true);
          } else {
            newMap.delete(status.profile_id);
          }
          
          return newMap;
        });
      }
    });

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [conversationId, user]);

  // Yeni mesaj geldiğinde otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function formatMessageTime(dateString: string) {
    return format(new Date(dateString), 'HH:mm', { locale: tr });
  }

  // Yazıyor metni için fonksiyon
  const getTypingText = () => {
    if (typingUsers.size === 0) return null;
    
    const typingUserIds = Array.from(typingUsers.keys());
    const typingProfiles = participants.filter(p => typingUserIds.includes(p.id));
    
    if (typingProfiles.length === 0) return null;
    
    if (typingProfiles.length === 1) {
      return `${typingProfiles[0].username} yazıyor...`;
    } else if (typingProfiles.length === 2) {
      return `${typingProfiles[0].username} ve ${typingProfiles[1].username} yazıyor...`;
    } else {
      return `${typingProfiles.length} kişi yazıyor...`;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto" ref={containerRef}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted-background rounded w-3/4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto" ref={containerRef}>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted">Henüz mesaj yok. Sohbeti başlatmak için bir mesaj gönderin.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {messages.map((message) => {
              const isMyMessage = message.profile_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} group`}
                >
                  {/* Yanıt göstergesi */}
                  {message.reply_to_message_id && (
                    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} w-full mb-1`}>
                      <div className={`max-w-xs sm:max-w-md px-3 py-1 rounded-md ${
                        isMyMessage ? 'bg-primary/10 text-primary' : 'bg-muted-background/50 text-muted'
                      } text-xs`}>
                        <ReplyMessagePreview messageId={message.reply_to_message_id} />
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} w-full`}>
                    <div
                      className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg relative ${
                        isMyMessage
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-muted-background text-foreground rounded-bl-none'
                      }`}
                    >
                      {/* Mesaj içeriği */}
                      {!isMyMessage && message.profile && (
                        <div className="font-medium text-xs mb-1">
                          {message.profile.full_name || message.profile.username}
                        </div>
                      )}
                      
                      {/* Dosya eki varsa */}
                      {message.attachment_url && (
                        <div className="mb-2">
                          {message.attachment_type?.startsWith('image/') ? (
                            <a 
                              href={message.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img 
                                src={message.attachment_url} 
                                alt="Görsel" 
                                className="max-w-full max-h-60 rounded-lg object-contain" 
                              />
                            </a>
                          ) : (
                            <a 
                              href={message.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center p-2 bg-muted-background rounded-lg hover:bg-muted"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                              <div className="text-sm truncate">{message.attachment_name || 'Dosya'}</div>
                            </a>
                          )}
                        </div>
                      )}

                      <div>{message.content}</div>
                      
                      <div
                        className={`text-xs mt-1 text-right ${
                          isMyMessage ? 'text-white opacity-75' : 'text-muted'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                        {message.read && isMyMessage && (
                          <span className="ml-1" title="Okundu">✓</span>
                        )}
                      </div>
                      
                      {/* Yanıtla butonu */}
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-3 right-2">
                        <button
                          onClick={() => setReplyToMessage(message)}
                          className="p-1 bg-card text-muted hover:text-foreground rounded-full shadow"
                          title="Yanıtla"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            
            {/* Yazıyor göstergesi */}
            {typingUsers.size > 0 && (
              <div className="flex justify-start mt-2">
                <div className="px-4 py-2 bg-muted-background rounded-lg text-muted text-sm flex items-center">
                  <div className="flex items-center mr-2">
                    {Array.from(typingUsers.keys()).length > 0 && participants
                      .filter(p => typingUsers.has(p.id))
                      .slice(0, 2)
                      .map((profile, index) => (
                        <div 
                          key={profile.id}
                          className="h-6 w-6 rounded-full bg-muted flex items-center justify-center -ml-2 first:ml-0 border border-background"
                          title={profile.username}
                        >
                          {profile.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt={profile.username} 
                              className="h-6 w-6 rounded-full object-cover" 
                            />
                          ) : (
                            <span className="text-xs">{profile.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      ))
                    }
                  </div>
                  <span className="mr-2">{getTypingText()}</span>
                  <div className="typing-animation">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Mesaj giriş alanı */}
      <MessageInput 
        conversationId={conversationId} 
        replyTo={replyToMessage} 
        onCancelReply={() => setReplyToMessage(null)} 
      />
    </div>
  );
}