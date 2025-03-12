'use client';

import { useState } from 'react';
import { sendMessage } from '@/lib/chat';
import { useAuth } from '../context/AuthContext';

interface MessageInputProps {
  conversationId: string;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!message.trim() || !user) return;

    setSending(true);
    
    try {
      await sendMessage(conversationId, user.id, message.trim());
      setMessage('');
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sticky bottom-0 bg-card border-t border-default w-full">
      <form onSubmit={handleSendMessage} className="p-2 md:p-4">
        <div className="flex items-center rounded-full border border-border bg-input overflow-hidden shadow-sm">
          <input
            type="text"
            placeholder="Bir mesaj yazın..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 py-2 px-4 bg-transparent outline-none min-w-0"
            disabled={sending}
          />

          {/* Dosya ekleme butonu */}
          <button 
            type="button" 
            className="p-2 text-muted hover:text-foreground focus:outline-none"
            title="Dosya ekle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="btn-primary p-2 md:px-4 md:py-2 rounded-full mr-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span className="hidden md:inline mr-1">Gönder</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}