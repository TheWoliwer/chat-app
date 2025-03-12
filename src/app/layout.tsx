import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProviderWrapper } from './components/AuthProviderWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Chat Uygulaması',
  description: 'Next.js ve Supabase ile geliştirilmiş bir chat uygulaması',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  );
}