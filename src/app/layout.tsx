import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getDictionary, getLocale } from "@/lib/i18n-server";
import { I18nProvider } from "@/app/_components/i18n-provider";
import { LanguageSwitcher } from "@/app/_components/language-switcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Orbit",
  description: "JWT auth todo app with assigned task workflow",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <I18nProvider locale={locale} messages={messages}>
          <div className="pointer-events-none fixed right-4 top-4 z-50">
            <div className="pointer-events-auto">
              <LanguageSwitcher />
            </div>
          </div>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
