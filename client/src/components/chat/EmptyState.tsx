"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function EmptyState() {
  const t = useTranslations('Index');

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 relative select-none -mt-6 sm:-mt-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center w-full relative z-10"
      >
        {/* Ultimate 3D Iridescent Liquid Glass Bubble Hero (Optically centered & Desktop macOS responsive) */}
        <div className="relative mb-6 sm:mb-8 flex items-center justify-center flex-shrink-0 group">
          
          {/* SVG Definitions for Synchronized Liquid Gradients & Filters */}
          <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
            <defs>
              {/* Background Liquid Mesh Gradient 1 */}
              <linearGradient id="fluid-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>

              {/* Foreground Star Fluid Gradient */}
              <linearGradient id="star-fluid-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Layer 1: Ambient Outer Multi-Color Glow Aura */}
          <div 
            className="absolute -inset-4 rounded-full blur-xl bg-gradient-to-tr from-blue-500 via-cyan-400 to-indigo-500 opacity-60 dark:opacity-80 -z-10" 
          />

          {/* Layer 2: 3D Iridescent Liquid Glass Sphere */}
          <div 
            className="relative flex items-center justify-center rounded-full overflow-hidden border-2 border-white/80 dark:border-white/30 shadow-[0_15px_45px_rgba(59,130,246,0.4)] dark:shadow-[0_20px_55px_rgba(139,92,246,0.5)] transition-transform duration-500 group-hover:scale-[1.03] w-[155px] h-[155px] sm:w-[185px] sm:h-[185px]"
          >
            {/* Liquid Wave Base */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Base Liquid Fill */}
              <circle cx="50" cy="50" r="50" fill="url(#fluid-grad-primary)" opacity="0.95" />
              <circle cx="35" cy="35" r="45" fill="url(#star-fluid-grad)" opacity="0.55" />
              <circle cx="65" cy="65" r="40" fill="url(#fluid-grad-primary)" opacity="0.4" />
            </svg>

            {/* 3D Glass Specular Reflection Crescent */}
            <div className="absolute top-1.5 left-3 w-[72%] h-[38%] rounded-[50%] bg-gradient-to-b from-white/85 via-white/20 to-transparent pointer-events-none z-10" />
            
            {/* Iridescent Edge Reflection & Inner Depth Shadow */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_14px_rgba(255,255,255,0.9),inset_0_-10px_20px_rgba(0,0,0,0.35)] pointer-events-none z-10" />

            {/* Layer 3: Weightless Floating Glass Star Icon */}
            <div className="relative z-20 flex items-center justify-center">
              <svg 
                className="w-24 h-24 sm:w-28 sm:h-28 filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Glowing Aura for Icon */}
                <g opacity="0.75">
                  <path 
                    d="M50 10 C51 32 68 45 90 46 C68 47 51 60 50 82 C49 60 32 47 10 46 C32 45 49 32 50 10 Z" 
                    fill="white" 
                  />
                </g>

                {/* Main Glass Star Body */}
                <path 
                  d="M50 10 C51 32 68 45 90 46 C68 47 51 60 50 82 C49 60 32 47 10 46 C32 45 49 32 50 10 Z" 
                  fill="url(#star-fluid-grad)" 
                  fillOpacity="0.65"
                  stroke="white" 
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Secondary Sparkle Star */}
                <path 
                  d="M76 14 C76.5 21 81.5 26 89 26.5 C81.5 27 76.5 32 76 39 C75.5 32 70.5 27 63 26.5 C70.5 26 75.5 21 76 14 Z" 
                  fill="url(#fluid-grad-primary)" 
                  fillOpacity="0.85"
                  stroke="white" 
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Sparkle Dot */}
                <circle 
                  cx="37" 
                  cy="50" 
                  r="3.5" 
                  fill="white" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Hero Title with Subtle Gradient Text */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight max-w-md mb-2">
          {t('title')}
        </h1>

        {/* Subtitle / Mode Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          <span>Liquid AI Workspace</span>
        </div>
      </motion.div>
    </div>
  );
}
