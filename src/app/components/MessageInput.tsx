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
    <form onSubmit={handleSendMessage} className="p-4 border-t">
      <div className="flex items-center">
        <input
          type="text"
          placeholder="Bir mesaj yazın..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-r-0 p-2"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gönder
        </button>
      </div>
    </form>
  );
}