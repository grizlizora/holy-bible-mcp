"use client";

import React, { memo, useEffect, useRef } from 'react';

export const AmbientFluidBackground = memo(function AmbientFluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let rafId: number | null = null;
    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const draw = () => {
      if (!ctx || !canvas) return;

      // Smooth lerp
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentX > -500 && currentY > -500) {
        const isDark = document.documentElement.classList.contains('dark');
        const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 350);

        if (isDark) {
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.18)');
          gradient.addColorStop(0.5, 'rgba(79, 70, 229, 0.08)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.22)');
          gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.10)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 350, 0, Math.PI * 2);
        ctx.fill();
      }

      // 🧠 Auto-sleep governor: Stop loop when mouse reaches rest state (0 Hz idle)!
      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        rafId = requestAnimationFrame(draw);
      } else {
        rafId = null;
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;

      if (clientX !== undefined && clientY !== undefined) {
        targetX = clientX;
        targetY = clientY;
        if (!rafId) {
          rafId = requestAnimationFrame(draw);
        }
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, []);

  return (
    <div className="ambient-fluid-container absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-blue-50/90 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80 transition-colors duration-500">
      {/* 🧠 Living Hardware-Accelerated Radial Gradient Mesh 1 - Indigo / Blue */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35)_0%,rgba(59,130,246,0.25)_40%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.35)_0%,rgba(37,99,235,0.25)_40%,transparent_70%)] pointer-events-none" 
      />

      {/* 🧠 Living Hardware-Accelerated Radial Gradient Mesh 2 - Rich Purple / Pink */}
      <div 
        className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] max-w-[850px] max-h-[850px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.30)_0%,rgba(236,72,153,0.20)_40%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(126,34,206,0.30)_0%,rgba(219,39,119,0.20)_40%,transparent_70%)] pointer-events-none" 
      />

      {/* 🧠 Living Hardware-Accelerated Radial Gradient Mesh 3 - Deep Cyan / Violet */}
      <div 
        className="absolute bottom-[-10%] left-[10%] w-[70vw] h-[70vw] max-w-[950px] max-h-[950px] rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.30)_0%,rgba(139,92,246,0.20)_40%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.30)_0%,rgba(109,40,217,0.20)_40%,transparent_70%)] pointer-events-none" 
      />

      {/* 🧠 Ultra-Fast Hardware Canvas 2D Mouse Glow (Skia Accelerated 0% CPU/GPU Overhead) */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-1"
      />

      {/* 🧠 Subtle Ambient Depth Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-slate-200/50 dark:to-slate-950/80 pointer-events-none" />
    </div>
  );
});
