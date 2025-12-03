import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/contexts/SidebarContext";
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

export const metadata: Metadata = {
  title: "Monetaize",
  description: "Monetaize - Retell AI Management Platform",
};

const messages = {
  es: esMessages,
  en: enMessages,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obtener locale de las cookies o usar default
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || routing.defaultLocale) as 'es' | 'en';
  const localeMessages = messages[locale] || messages[routing.defaultLocale as 'es' | 'en'];

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={localeMessages}>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
