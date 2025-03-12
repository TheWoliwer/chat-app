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
  const [showParticipants, setShowParticipants] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState<{[key: string]: boolean}>({});
  const [lastSeenTimes, setLastSeenTimes] = useState<{[key: string]: string}>({});
  const conversationId = Array.isArray(id) ? id[0] : id;

  // Başka bir şey tıklandığında katılımcı menüsünü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showParticipants) {
        setShowParticipants(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showParticipants]);

  useEffect(() => {
    async function fetchParticipants() {
      if (user && conversationId) {
        setLoading(true);
        
        try {
          // Önce yalnızca katılımcı ID'lerini getir
          const { data: participantData, error: participantError } = await supabase
            .from('conversation_participants')
            .select('profile_id')
            .eq('conversation_id', conversationId);

          if (participantError) throw participantError;

          if (participantData && participantData.length > 0) {
            // Sonra ayrı bir sorgu ile profil bilgilerini al
            const profileIds = participantData.map(item => item.profile_id);
            
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .in('id', profileIds);

            if (profileError) throw profileError;
            
            if (profileData) {
              setParticipants(profileData);
            }
          } else {
            setParticipants([]);
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

  // Katılımcılar menüsünü açma
  const toggleParticipantsMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowParticipants(!showParticipants);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-3 md:p-4 border-b border-default flex items-center bg-card sticky top-0 z-10">
        <h1 className="text-lg md:text-xl font-semibold">{getConversationTitle()}</h1>
        
        {participants.length > 1 && (
          <div className="ml-auto flex items-center">
            <div className="flex">
              {participants
                .filter(p => p.id !== user?.id)
                .slice(0, 3)
                .map((participant) => (
                  <div 
                    key={participant.id} 
                    className="flex-shrink-0 -ml-2 first:ml-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background"
                    title={participant.full_name || participant.username}
                  >
                    {participant.avatar_url ? (
                      <img
                        src={participant.avatar_url}
                        alt={participant.username}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">
                        {participant.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              {participants.length > 4 && (
                <div className="flex-shrink-0 -ml-2 h-8 w-8 rounded-full bg-muted-background flex items-center justify-center border-2 border-background">
                  <span className="text-xs text-muted">+{participants.length - 4}</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={toggleParticipantsMenu}
              className="ml-2 p-2 text-muted hover:text-foreground rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            
            {/* Katılımcılar açılır menüsü */}
            {showParticipants && (
              <div 
                className="absolute right-4 top-16 w-60 bg-card rounded-md shadow-lg border border-border z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  <h3 className="text-sm font-medium p-2">Katılımcılar</h3>
                  <ul className="mt-1 max-h-60 overflow-y-auto">
                    {participants.map((participant) => (
                      <li key={participant.id} className="flex items-center p-2 hover:bg-muted-background rounded-md">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {participant.avatar_url ? (
                            <img
                              src={participant.avatar_url}
                              alt={participant.username}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">
                              {participant.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium">{participant.full_name || participant.username}</div>
                          <div className="text-xs text-muted">@{participant.username}</div>
                        </div>
                        {participant.id === user?.id && (
                          <span className="ml-auto text-xs bg-primary-light text-primary px-2 py-1 rounded-full">Sen</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
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