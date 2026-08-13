"use client";

import React from 'react';
import { AmbientFluidBackground } from '@/components/chat/AmbientFluidBackground';

export function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden">
      <AmbientFluidBackground />
      <div className="relative z-10 flex h-[100dvh] w-full">
        {children}
      </div>
    </div>
  );
}
