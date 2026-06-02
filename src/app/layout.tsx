import React from 'react';
import './globals.css';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { AIBot } from '@/components/shared/AIBot';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { RealtimeStatusProvider } from '@/components/shared/RealtimeStatusProvider';

export const metadata = {
  title: "MedFlow - Healthcare Platform",
  description: "Connect with healthcare providers, book appointments, and manage your health journey",
};

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="mood-clinical density-regular min-h-full">
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
