import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';
import { ExtensionShield } from '@/components/providers/ExtensionShield';
import '../globals.css';

import Script from 'next/script';
import { DesktopFrame } from '@/components/layout/DesktopFrame';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://telegram.org" />
        <link rel="dns-prefetch" href="https://telegram.org" />
      </head>
      <body suppressHydrationWarning className="antialiased liquid-bg hw-high min-h-[100dvh] font-sans text-slate-900 dark:text-slate-100">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            enableColorScheme={false}
            disableTransitionOnChange
          >
            <ExtensionShield />
            <DesktopFrame>
              {children}
            </DesktopFrame>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
