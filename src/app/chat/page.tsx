'use client';

export default function ChatPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-medium text-gray-900">Sohbete başlamak için bir konuşma seçin</h2>
        <p className="mt-2 text-gray-600">
          veya yeni bir sohbet başlatmak için sol üstteki + butonuna tıklayın
        </p>
      </div>
    </div>
  );
}