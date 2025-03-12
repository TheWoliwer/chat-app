'use client';

import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker başarıyla kaydedildi:', registration);
        })
        .catch(error => {
          console.error('Service Worker kaydı başarısız:', error);
        });
    } catch (error) {
      console.error('Service Worker kaydı sırasında hata:', error);
    }
  }
}

export function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}