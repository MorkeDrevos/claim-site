import type { Metadata } from "next";
import type React from "react";
import "./globals.css";
import Image from "next/image";

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
      <body>{children}</body>
    </html>
  );
}
