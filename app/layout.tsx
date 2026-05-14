import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Poster Generator",
  description: "Internal AI poster generator"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
