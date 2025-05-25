"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { TitleBar } from "@/components/TitleBar";
import AutoUpdater from "@/components/AutoUpdater";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    // Tema değişikliklerini uygula
    const applyTheme = () => {
      const root = window.document.documentElement;

      if (theme === 'system') {
        // Sistem temasını kullan
        root.classList.remove('dark', 'light');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        // Kullanıcı temasını kullan
        root.classList.remove('dark', 'light');
        root.classList.add(theme);
      }
    };

    applyTheme();

    // Sistem teması değişikliklerini dinle
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <html lang="tr">
      <head>
        <title>AnyAssist - AI Masaüstü Asistanı</title>
        <meta name="description" content="AnyAssist, Gemini API kullanarak yapay zeka destekli bir masaüstü asistanıdır." />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--chat-bg)] flex flex-col h-screen`}
      >
        <TitleBar />
        <AutoUpdater />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
