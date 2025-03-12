'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getConversationMessages, subscribeToMessages } from '@/lib/chat';
import { useAuth } from '../context/AuthContext';
import { Message } from '@/lib/supabase';

interface MessageListProps {
  conversationId: string;
}

export default function MessageList({ conversationId }: MessageListProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMessages() {
      if (conversationId) {
        setLoading(true);
        const { messages } = await getConversationMessages(conversationId);
        setMessages(messages as Message[]);
        setLoading(false);
      }
    }

    loadMessages();

    // Gerçek zamanlı mesaj aboneliği
    const subscription = subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  // Yeni mesaj geldiğinde otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function formatMessageTime(dateString: string) {
    return format(new Date(dateString), 'HH:mm', { locale: tr });
  }

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded w-3/4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">Henüz mesaj yok. Sohbeti başlatmak için bir mesaj gönderin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const isMyMessage = message.profile_id === user?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                    isMyMessage
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {!isMyMessage && message.profile && (
                    <div className="font-medium text-xs mb-1">
                      {message.profile.full_name || message.profile.username}
                    </div>
                  )}
                  <div>{message.content}</div>
                  <div
                    className={`text-xs mt-1 text-right ${
                      isMyMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}