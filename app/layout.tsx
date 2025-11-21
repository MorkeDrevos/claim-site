import type { Metadata } from 'next';
import React from 'react'; 
import './globals.css';

import { ClientProviders } from './ClientProviders';

export const metadata: Metadata = {
  title: '$CLAIM Portal',
  description: 'The official $CLAIM pool portal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
