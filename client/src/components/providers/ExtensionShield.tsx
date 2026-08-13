"use client";

import { useEffect } from 'react';

export function ExtensionShield() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const stack = reason?.stack || String(reason || '');
      const message = reason?.message || String(reason || '');

      // 🧠 Shield errors originating from injected Chrome/Brave extension scripts (e.g. Brave Wallet injectedScript.bundle.js)
      const isExtensionError =
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        stack.includes('injectedScript.bundle.js') ||
        stack.includes('dmkamcknogkgcdfhhbddcghachkejeap') ||
        message.includes('not found method');

      if (isExtensionError) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      const filename = event.filename || '';
      const message = event.message || '';
      if (
        filename.includes('chrome-extension://') ||
        filename.includes('moz-extension://') ||
        filename.includes('injectedScript.bundle.js') ||
        filename.includes('dmkamcknogkgcdfhhbddcghachkejeap') ||
        message.includes('not found method')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
    window.addEventListener('error', handleWindowError, { capture: true });
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
      window.removeEventListener('error', handleWindowError, { capture: true });
    };
  }, []);

  return null;
}
