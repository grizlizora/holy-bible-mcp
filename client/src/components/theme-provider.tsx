"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from "react";
import { detectHardwareSpecs, applyHardwareProfile } from "@/lib/hardware-engine";
import { fpsGovernor } from "@/lib/fps-governor";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Defer Hardware Cores Detection to requestIdleCallback to prevent tab focus hydration thrashing
    const initHardware = () => {
      const specs = detectHardwareSpecs();
      applyHardwareProfile(specs);
      fpsGovernor.start(specs.profile);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(initHardware);
    } else {
      setTimeout(initHardware, 100);
    }

    // 2. Telegram WebApp Theme Synchronization
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      const syncTelegramTheme = () => {
        if (tg.colorScheme) {
          if (tg.colorScheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };
      syncTelegramTheme();
      if (typeof tg.onEvent === 'function') {
        tg.onEvent('themeChanged', syncTelegramTheme);
      }
    }

    return () => {
      fpsGovernor.stop();
    };
  }, []);

  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}
