import type { Metadata } from "next";
import type React from "react";

import "@solana/wallet-adapter-react-ui/styles.css";  // wallet UI styles first
import "./globals.css";                               // then your globals

import { Analytics } from "@vercel/analytics/react";
import WalletContextProvider from "../components/WalletContextProvider";

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
