import type { Metadata } from "next";
import type React from "react";
import "./globals.css";
import Image from "next/image";
import { Analytics } from '@vercel/analytics/react';

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
        {children}
        <Analytics />   {/* ✅ add this */}
      </body>
    </html>
  );
}
