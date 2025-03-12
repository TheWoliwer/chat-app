'use client';

import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';

function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker başarıyla kaydedildi:', registration);
      })
      .catch(error => {
        console.error('Service Worker kaydı başarısız:', error);
      });
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
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}