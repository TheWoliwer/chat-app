'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import ConversationList from '../components/ConversationList';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="bg-white w-full max-w-xs border-r">
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-xl font-semibold">Sohbetler</h1>
            <div className="flex space-x-2">
              <Link
                href="/chat/new"
                className="inline-flex items-center p-2 text-sm text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200"
                title="Yeni sohbet"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </Link>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center p-2 text-sm text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200"
                title="Menü"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-4 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <div className="px-4 py-2 text-sm text-gray-700">
                  <p className="font-medium">{user?.profile?.full_name || user?.profile?.username}</p>
                  <p className="text-gray-500">@{user?.profile?.username}</p>
                </div>
                <hr />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}

          {/* Conversation List */}
          <ConversationList />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}