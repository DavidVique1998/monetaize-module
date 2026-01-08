import React from 'react';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';
import esMessages from '../messages/es.json';
import enMessages from '../messages/en.json';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "CAMIA | Agentes de Inteligencia Artificial | En Todos tus Canales",
    template: "%s | CAMIA"
  },
  description: "Agentes IA en Facebook, Instagram, WhatsApp, Páginas Web, Llamadas Telefónicas y Correos Electrónicos.",
  icons: {
    icon: '/images/favicon.ico',
    shortcut: '/images/favicon.ico',
    apple: '/images/favicon.ico',
  },
  openGraph: {
    title: "CAMIA | Agentes de Inteligencia Artificial | En Todos tus Canales",
    description: "Agentes IA en Facebook, Instagram, WhatsApp, Páginas Web, Llamadas Telefónicas y Correos Electrónicos.",
  },
};

const messages = {
  es: esMessages,
  en: enMessages,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactNode> {
  // Obtener locale de las cookies o usar default
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || routing.defaultLocale) as 'es' | 'en';
  const localeMessages = messages[locale] || messages[routing.defaultLocale as 'es' | 'en'];

  return (
    <html lang={locale} suppressHydrationWarning className="bg-background text-foreground">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased bg-background text-foreground min-h-screen transition-colors`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={localeMessages}>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
