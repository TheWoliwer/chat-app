'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getUserConversations } from '@/lib/chat';
import { useAuth } from '../context/AuthContext';
import { Conversation, Profile } from '@/lib/supabase';

interface ConversationListProps {
  onConversationSelected?: () => void;
}

export default function ConversationList({ onConversationSelected }: ConversationListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      if (user) {
        setLoading(true);
        const { conversations } = await getUserConversations(user.id);
        setConversations(conversations as Conversation[]);
        setLoading(false);
      }
    }

    loadConversations();
  }, [user]);

  function getConversationName(conversation: Conversation) {
    if (!conversation.participants || !user) return 'Yeni Sohbet';

    const otherParticipants = conversation.participants.filter((p: Profile) => p.id !== user.id);
    
    if (otherParticipants.length === 0) return 'Sadece ben';
    
    if (otherParticipants.length === 1) {
      return otherParticipants[0].full_name || otherParticipants[0].username;
    }
    
    return `${otherParticipants[0].username} ve ${otherParticipants.length - 1} kişi daha`;
  }

  function getLastMessagePreview(conversation: Conversation) {
    if (!conversation.last_message) return 'Henüz mesaj yok';
    return conversation.last_message.content.length > 30
      ? `${conversation.last_message.content.substring(0, 30)}...`
      : conversation.last_message.content;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm', { locale: tr });
    } else {
      return format(date, 'd MMM', { locale: tr });
    }
  }

  // Konuşmaya tıklandığında yönlendirme ve callback
  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
    if (onConversationSelected) {
      onConversationSelected();
    }
  };

  // Aktif konuşmayı belirle
  const isActiveConversation = (conversationId: string) => {
    return pathname === `/chat/${conversationId}`;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>Henüz sohbet yok</p>
          <Link href="/chat/new" className="inline-block mt-2 text-primary hover:text-primary-hover">
            Yeni sohbet başlat
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <li 
              key={conversation.id}
              onClick={() => handleConversationClick(conversation.id)}
              className={`cursor-pointer ${isActiveConversation(conversation.id) ? 'bg-primary-light' : 'hover:bg-muted-background'}`}
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${isActiveConversation(conversation.id) ? 'text-primary' : 'text-blue-600'} truncate`}>
                    {getConversationName(conversation)}
                  </p>
                  {conversation.last_message && (
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 text-xs text-gray-500">
                        {formatDate(conversation.last_message.created_at)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-sm text-gray-600 truncate">
                    {getLastMessagePreview(conversation)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}