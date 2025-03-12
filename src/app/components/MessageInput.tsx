'use client';

import { useState, useEffect, useRef } from 'react';
import { sendMessage, replyToMessage, updateTypingStatus, uploadFile, sendMessageWithAttachment } from '@/lib/chat';
import { useAuth } from '../context/AuthContext';
import { Message } from '@/lib/supabase';
import EmojiPicker from './EmojiPicker';

interface MessageInputProps {
  conversationId: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

export default function MessageInput({ 
  conversationId, 
  replyTo = null, 
  onCancelReply = () => {} 
}: MessageInputProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [filePreview, setFilePreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputContainerRef = useRef<HTMLDivElement>(null);

  // iOS için klavye davranışını yönet
  useEffect(() => {
    // Yalnızca iOS cihazlarda çalışacak
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      const handleFocus = () => {
        // Klavye açıldığında biraz gecikme ile scroll
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
        }, 100);
      };
      
      const handleBlur = () => {
        // Klavye kapandığında scroll konumunu sıfırla
        window.scrollTo(0, 0);
      };
      
      if (inputRef.current) {
        inputRef.current.addEventListener('focus', handleFocus);
        inputRef.current.addEventListener('blur', handleBlur);
        
        return () => {
          if (inputRef.current) {
            inputRef.current.removeEventListener('focus', handleFocus);
            inputRef.current.removeEventListener('blur', handleBlur);
          }
        };
      }
    }
  }, []);

  // Dosya seçildiğinde
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setUploadingFile(true);
      
      // Önizleme için
      const objectUrl = URL.createObjectURL(file);
      setFilePreview({
        url: objectUrl,
        type: file.type,
        name: file.name
      });
      
      // Dosya yükleme işlemi burada yapılabilir veya mesaj gönderildiğinde yapılabilir
      // Bu örnekte, dosyayı hemen yüklemek yerine, mesaj gönderildiğinde yüklüyoruz
    } catch (error) {
      console.error('Dosya seçilirken hata:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  // Önizlemeyi iptal et
  const cancelFilePreview = () => {
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Emoji seçildiğinde
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Yanıtlama modu aktif olduğunda input'a odaklan
  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  // Yazma durumunu kontrol ediyoruz
  useEffect(() => {
    return () => {
      // Sayfa kapandığında timeout'u temizliyoruz
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Sayfa değiştiğinde yazma durumunu false yapıyoruz
      if (user && conversationId) {
        updateTypingStatus(conversationId, user.id, false);
      }
    };
  }, [conversationId, user]);

  // Kullanıcı yazmaya başladığında
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    if (user && conversationId) {
      // Kullanıcı yazıyorsa, yazma durumunu güncelliyoruz
      updateTypingStatus(conversationId, user.id, true);
      
      // Önceki timeout'u iptal ediyoruz
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // 3 saniye sonra yazma durumunu false yapıyoruz
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(conversationId, user.id, false);
      }, 3000);
    }
  };

  // Mesaj gönderme işlemi
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if ((!message.trim() && !filePreview) || !user) return;

    setSending(true);
    
    try {
      // Mesaj gönderildiğinde yazma durumunu kapatıyoruz
      updateTypingStatus(conversationId, user.id, false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Dosya varsa önce onu yükle
      if (filePreview) {
        const fileInput = fileInputRef.current;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          const { success, url, fileType, fileName, error } = await uploadFile(file, user.id);
          
          if (success && url) {
            // Dosya ve mesaj içeriği ile birlikte gönder
            await sendMessageWithAttachment(
              conversationId, 
              user.id, 
              message.trim() || 'Dosya gönderildi', 
              url, 
              fileType || file.type, 
              fileName || file.name
            );
          } else {
            console.error('Dosya yüklenirken hata:', error);
          }
        }
        
        // Dosya önizlemesini temizle
        cancelFilePreview();
      } else {
        // Normal mesaj gönderme
        if (replyTo) {
          // Yanıt modu aktifse, yanıt olarak gönder
          await replyToMessage(conversationId, user.id, message.trim(), replyTo.id);
          onCancelReply(); // Yanıt modunu kapat
        } else {
          // Normal mesaj gönder
          await sendMessage(conversationId, user.id, message.trim());
        }
      }
      
      setMessage('');
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div 
      className="sticky bottom-0 bg-card border-t border-default w-full z-10"
      ref={messageInputContainerRef}
    >
      {/* Yanıt göstergesi */}
      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted-background">
          <div className="flex items-center">
            <div className="w-1 h-full bg-primary mr-2"></div>
            <div>
              <div className="text-xs text-primary font-medium">
                {replyTo.profile?.username || 'Kullanıcı'} kullanıcısına yanıt veriliyor
              </div>
              <div className="text-sm text-foreground truncate">
                {replyTo.content.length > 50 
                  ? `${replyTo.content.substring(0, 50)}...` 
                  : replyTo.content}
              </div>
            </div>
          </div>
          <button 
            onClick={onCancelReply}
            className="text-muted hover:text-foreground p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Dosya önizleme */}
      {filePreview && (
        <div className="px-4 py-2 bg-muted-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-card rounded flex items-center justify-center mr-2">
                {filePreview.type.startsWith('image/') ? (
                  <img 
                    src={filePreview.url} 
                    alt="Önizleme" 
                    className="h-10 w-10 object-cover rounded" 
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-medium truncate max-w-xs">
                  {filePreview.name}
                </div>
                <div className="text-xs text-muted">
                  {filePreview.type}
                </div>
              </div>
            </div>
            <button 
              onClick={cancelFilePreview}
              className="text-muted hover:text-foreground p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="p-2 md:p-4">
        <div className="flex items-center rounded-full border border-border bg-input overflow-hidden shadow-sm">
          {/* Emoji butonu */}
          <button 
            type="button" 
            className="p-3 text-muted hover:text-foreground focus:outline-none"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji ekle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder={replyTo 
              ? "Yanıtınızı yazın..." 
              : filePreview 
                ? "Dosya ile birlikte mesaj gönder (opsiyonel)..." 
                : "Bir mesaj yazın..."
            }
            value={message}
            onChange={handleInputChange}
            className="flex-1 py-3 px-1 bg-transparent outline-none min-w-0 text-foreground"
            disabled={sending || uploadingFile}
          />

          {/* Dosya ekleme butonu */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
          />
          
          <button 
            type="button" 
            className="p-3 text-muted hover:text-foreground focus:outline-none"
            onClick={() => fileInputRef.current?.click()}
            title="Dosya ekle"
            disabled={sending || uploadingFile}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <button
            type="submit"
            disabled={(!message.trim() && !filePreview) || sending || uploadingFile}
            className="btn-primary p-3 md:px-5 md:py-3 rounded-full mr-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-primary hover:bg-primary-hover text-white transition-colors"
          >
            {sending || uploadingFile ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span className="hidden md:inline mr-1">
                  {replyTo ? 'Yanıtla' : filePreview ? 'Gönder' : 'Gönder'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Emoji seçici */}
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={handleEmojiSelect} 
          onClose={() => setShowEmojiPicker(false)} 
        />
      )}
    </div>
  );
}