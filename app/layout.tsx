import type { Metadata } from "next";
import type React from "react";
import "./globals.css";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/react";

import '../styles/globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import WalletContextProvider from '../components/WalletContextProvider';

export const metadata: Metadata = {
  title: "$CLAIM Portal",
  description: "The official $CLAIM pool portal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>

        <Analytics />
      </body>
    </html>
  );
}
