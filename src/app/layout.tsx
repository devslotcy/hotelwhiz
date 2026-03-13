import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HotelWhiz.ai — AI Chat Widget for Hotels",
  description:
    "AI-powered chat widget that answers guest questions and redirects to WhatsApp for direct bookings. Skip OTA commissions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster theme="dark" position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
