'use client';

import { useState, useEffect, useRef } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// Basit bir emoji listesi (gerçek uygulamada daha kapsamlı olabilir)
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
  '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
  '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦',
  '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
  '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '👍', '👎', '❤️', '💯'
];

// Emoji kategorileri
const categories = [
  { name: 'Yüzler', emoji: '😀' },
  { name: 'Hareketler', emoji: '👍' },
  { name: 'Nesneler', emoji: '🎮' },
  { name: 'Semboller', emoji: '❤️' }
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Filtrelenmiş emojiler
  const filteredEmojis = searchTerm 
    ? emojiList.filter(emoji => 
        emoji.includes(searchTerm) || 
        emoji.toLowerCase().includes(searchTerm.toLowerCase()))
    : emojiList;

  // Dışarı tıklandığında kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-16 right-4 w-64 max-h-96 bg-card rounded-lg shadow-lg border border-border z-20 overflow-hidden"
    >
      <div className="p-2 border-b border-border">
        <input
          type="text"
          placeholder="Emoji ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded-md bg-input border border-border focus:outline-none focus:border-primary"
        />
      </div>
      
      <div className="flex border-b border-border">
        {categories.map((category, index) => (
          <button
            key={category.name}
            className={`flex-1 p-2 text-center hover:bg-muted-background ${
              activeCategory === index ? 'border-b-2 border-primary' : ''
            }`}
            onClick={() => setActiveCategory(index)}
          >
            <span className="text-lg">{category.emoji}</span>
          </button>
        ))}
      </div>
      
      <div className="p-2 grid grid-cols-7 gap-1 max-h-60 overflow-y-auto">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            className="h-8 w-8 flex items-center justify-center hover:bg-muted-background rounded-md text-lg"
          >
            {emoji}
          </button>
        ))}
        
        {filteredEmojis.length === 0 && (
          <div className="col-span-7 p-4 text-center text-muted">
            Emoji bulunamadı
          </div>
        )}
      </div>
    </div>
  );
}