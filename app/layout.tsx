import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "$CLAIM – The Token of Timing",
  description: "Claim your rewards from The Burning Bear ecosystem."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#020817] text-slate-100">
        {children}
      </body>
    </html>
  );
}
