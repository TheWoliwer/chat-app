'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import UserSearch from '@/app/components/UserSearch';
import { createConversation } from '@/lib/chat';
import { Profile } from '@/lib/supabase';

export default function NewChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSelectUser = (selectedUser: Profile) => {
    setSelectedUsers([...selectedUsers, selectedUser]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateConversation = async () => {
    if (!user || selectedUsers.length === 0) return;

    setCreating(true);
    setError('');

    try {
      // Tüm katılımcıları içeren dizi (kendimiz dahil)
      const participantIds = [user.id, ...selectedUsers.map(u => u.id)];
      
      const { success, conversation, error } = await createConversation(participantIds);
      
      if (success && conversation) {
        router.push(`/chat/${conversation.id}`);
      } else {
        setError('Sohbet oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
        console.error(error);
      }
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu.');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-card">
      <div className="p-4 border-b border-default sticky top-0 z-10 bg-card">
        <h1 className="text-xl font-semibold">Yeni Sohbet</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-medium text-card-foreground">Kişileri Seç</h2>
          <p className="mt-1 text-sm text-muted">
            Sohbet başlatmak istediğiniz kişileri arayın ve seçin
          </p>

          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-error px-4 py-3 rounded">
              {error}
            </div>
          )}

          <UserSearch 
            onSelectUser={handleSelectUser} 
            selectedUsers={selectedUsers} 
          />

          {selectedUsers.length > 0 && (
            <div className="mt-6 bg-muted-background p-4 rounded-lg">
              <h3 className="text-sm font-medium text-card-foreground">Seçilen Kişiler</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUsers.map(selectedUser => (
                  <div 
                    key={selectedUser.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-light text-primary"
                  >
                    {selectedUser.full_name || selectedUser.username}
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(selectedUser.id)}
                      className="ml-2 inline-flex items-center justify-center text-primary hover:text-primary-hover"
                    >
                      <span className="sr-only">Kaldır</span>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleCreateConversation}
              disabled={creating || selectedUsers.length === 0}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
                (creating || selectedUsers.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {creating ? 'Oluşturuluyor...' : 'Sohbeti Başlat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}