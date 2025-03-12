'use client';

import { useEffect, useState } from 'react';
import { getReplyMessage } from '@/lib/chat';
import { Message } from '@/lib/supabase';

interface ReplyMessagePreviewProps {
  messageId: string;
}

export default function ReplyMessagePreview({ messageId }: ReplyMessagePreviewProps) {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReplyMessage() {
      setLoading(true);
      const { message, success } = await getReplyMessage(messageId);
      if (success && message) {
        setMessage(message as Message);
      }
      setLoading(false);
    }

    fetchReplyMessage();
  }, [messageId]);

  if (loading) {
    return <span>Yükleniyor...</span>;
  }

  if (!message) {
    return <span>Yanıtlanan mesaj bulunamadı</span>;
  }

  return (
    <div className="flex flex-col">
      <div className="font-medium text-xs">
        {message.profile?.username || 'Kullanıcı'}
      </div>
      <div className="truncate">
        {message.content.length > 50 
          ? `${message.content.substring(0, 50)}...` 
          : message.content}
      </div>
    </div>
  );
}