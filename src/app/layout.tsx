import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OfferOS",
  description: "你的求职进度管理平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full`}>
      <body className="h-full antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
