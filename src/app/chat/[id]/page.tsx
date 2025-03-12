'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import MessageList from '@/app/components/MessageList';
import MessageInput from '@/app/components/MessageInput';
import { Profile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export default function ChatDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const conversationId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    async function fetchParticipants() {
      if (user && conversationId) {
        setLoading(true);
        
        try {
          const { data, error } = await supabase
            .from('conversation_participants')
            .select(`
              profile_id,
              profiles:profile_id (
                id, username, full_name, avatar_url
              )
            `)
            .eq('conversation_id', conversationId);

          if (error) throw error;

          if (data) {
            const participantProfiles = data
              .map(item => item.profiles as Profile)
              .filter(Boolean);
            
            setParticipants(participantProfiles);
          }
        } catch (error) {
          console.error('Katılımcılar alınırken hata:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchParticipants();
  }, [conversationId, user]);

  function getConversationTitle() {
    if (loading) return 'Yükleniyor...';
    if (participants.length === 0) return 'Sohbet';
    
    const otherParticipants = participants.filter(p => p.id !== user?.id);
    
    if (otherParticipants.length === 0) return 'Not Defteri';
    
    if (otherParticipants.length === 1) {
      return otherParticipants[0].full_name || otherParticipants[0].username;
    }
    
    return `${otherParticipants[0].username} ve ${otherParticipants.length - 1} kişi daha`;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center">
        <h1 className="text-xl font-semibold">{getConversationTitle()}</h1>
        {participants.length > 1 && (
          <div className="ml-auto flex">
            {participants
              .filter(p => p.id !== user?.id)
              .slice(0, 3)
              .map((participant) => (
                <div 
                  key={participant.id} 
                  className="flex-shrink-0 -ml-2 first:ml-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white"
                  title={participant.full_name || participant.username}
                >
                  {participant.avatar_url ? (
                    <img
                      src={participant.avatar_url}
                      alt={participant.username}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-white">
                      {participant.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            {participants.length > 4 && (
              <div className="flex-shrink-0 -ml-2 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white">
                <span className="text-xs text-gray-600">+{participants.length - 4}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <MessageList conversationId={conversationId} />
      <MessageInput conversationId={conversationId} />
    </div>
  );
}