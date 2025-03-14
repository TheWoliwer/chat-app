'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import ConversationList from '../components/ConversationList';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Mevcut yolu almak için
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Mesaj detay sayfasında olup olmadığımızı kontrol et
  const isInChatDetailPage = /^\/chat\/[^\/]+$/.test(pathname || '');
  
  // Sayfalar arası geçişlerde yan menüyü kapat
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Ekran boyutu değiştiğinde yan çubuğu kapat
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobil cihazlarda klavye açıldığında sayfanın yüksekliğini düzeltmek için
  useEffect(() => {
    const handleResize = () => {
      // iOS için viewport yüksekliğini ayarla
      if (typeof window !== 'undefined') {
        document.documentElement.style.setProperty(
          '--vh', 
          `${window.innerHeight * 0.01}px`
        );
      }
    };

    // İlk yükleme ve resize olaylarında çalıştır
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // iOS'ta klavye açıldığında resize olayı tetiklenir
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Tıklama yayılımını engelle (event bubbling)
  const handleSidebarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <ProtectedRoute>
      <style jsx global>{`
        :root {
          --vh: 1vh; /* Fallback */
        }
        
        .h-screen-custom {
          height: 100vh; /* Fallback */
          height: calc(var(--vh, 1vh) * 100);
        }
        
        /* Taşma sorununun önüne geçmek için */
        html, body {
          overscroll-behavior: none;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        
        /* Safari için ekstra düzeltme */
        @supports (-webkit-touch-callout: none) {
          .h-screen-custom {
            height: -webkit-fill-available;
          }
        }
      `}</style>
    
      <div className="flex h-screen-custom bg-background">
        {/* Mobil yan çubuk arka planı */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Yan çubuk - Daima görünür ve sabit */}
        <div 
          className={`bg-card border-r border-default fixed md:static inset-y-0 left-0 z-30 w-80 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } transition-transform duration-200 ease-in-out flex flex-col h-full`}
          onClick={handleSidebarClick}
        >
          <div className="p-4 border-b border-default flex items-center justify-between">
            <h1 className="text-xl font-semibold">Sohbetler</h1>
            <div className="flex space-x-2">
              <Link
                href="/chat/new"
                className="inline-flex items-center p-2 text-sm bg-primary text-white rounded-full hover:bg-primary-hover"
                title="Yeni sohbet"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="inline-flex items-center p-2 text-sm bg-muted-background text-foreground rounded-full hover:bg-muted"
                title="Menü"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Sadece mobilde görünür kapatma butonu */}
            <button 
              className="md:hidden ml-2 p-2 text-sm rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setIsSidebarOpen(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Açılır Menü */}
          {isMenuOpen && (
            <div 
              className="absolute right-4 mt-2 w-56 rounded-md shadow-lg bg-card ring-1 ring-border z-40"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1" role="menu" aria-orientation="vertical">
                <div className="px-4 py-2 text-sm text-foreground">
                  <p className="font-medium">{user?.profile?.full_name || user?.profile?.username}</p>
                  <p className="text-muted">@{user?.profile?.username}</p>
                </div>
                <hr className="border-border" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-muted-background"
                  role="menuitem"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}

          {/* Konuşma Listesi */}
          <div className="flex-1 overflow-y-auto">
            <ConversationList onConversationSelected={() => setIsSidebarOpen(false)} />
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="flex-1 flex flex-col w-full max-w-full overflow-hidden">
        {/* Mobil başlık ve menü butonu - Sabit pozisyonda */}
          {isInChatDetailPage && (
            <div className="md:hidden flex items-center p-3 border-b border-default bg-card sticky top-0 z-10">
              <button 
                className="p-2 rounded-full"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-lg font-medium ml-2">Şevin❤️Doğukan Chat</h1>
            </div>
          )}
          
          {/* Chat sayfasında da menü butonunu göster */}
          {!isInChatDetailPage && pathname === '/chat' && (
            <div className="md:hidden flex items-center p-3 border-b border-default bg-card sticky top-0 z-10">
              <button 
                className="p-2 rounded-full"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-lg font-medium ml-2">Sohbetler</h1>
            </div>
          )}
          
          {/* Yeni sohbet sayfasında da menü butonunu göster */}
          {pathname === '/chat/new' && (
            <div className="md:hidden flex items-center p-3 border-b border-default bg-card sticky top-0 z-10">
              <button 
                className="p-2 rounded-full"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-lg font-medium ml-2">Yeni Sohbet</h1>
            </div>
          )}
          
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}