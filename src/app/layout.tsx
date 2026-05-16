import React from 'react';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AIBot } from '@/components/shared/AIBot';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { RealtimeStatusProvider } from '@/components/shared/RealtimeStatusProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ErrorBoundary>
          <AuthProvider>
            <RealtimeStatusProvider>
              {children}
              <AIBot />
            </RealtimeStatusProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
