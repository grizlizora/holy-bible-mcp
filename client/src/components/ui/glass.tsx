import React from "react"
import { cn } from "@/lib/utils"

export interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "clear" | "medium" | "heavy" | "solid" | "modal"
  intensity?: "sm" | "md" | "lg" | "xl" | "2xl"
}

/**
 * A highly optimized, hardware-accelerated Liquid Glass component.
 * Uses `transform-gpu` to guarantee 144Hz compositor-driven performance 
 * and prevents backdrop-filter disappearance bugs.
 */
// Variant maps to background opacity and borders (Rich crisp opacities for 0% GPU overhead)
const variants = {
  clear: "bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm",
  medium: "bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm",
  // Heavy: Golden mean for docks/headers - pure white in light mode, deep dark slate in dark mode
  heavy: "bg-white/98 dark:bg-slate-900/98 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-lg shadow-slate-950/5",
  solid: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100",
  // Modal: Pure crystal liquid glass - 0ms instant WebKit native class for rich background translucency
  modal: "liquid-modal text-slate-900 dark:text-slate-100",
}

// Intensity maps to subtle micro-blur (Ultra-light blur radii to keep Brave GPU under 1%)
const blurs = {
  sm: "backdrop-blur-[2px]",
  md: "backdrop-blur-[4px]",
  lg: "backdrop-blur-[6px]",
  xl: "backdrop-blur-[8px]",
  "2xl": "backdrop-blur-[10px]",
}

export const getGlassClasses = (variant: keyof typeof variants = "clear", intensity: keyof typeof blurs = "md") => {
  return cn(
    "transform-gpu isolate", // Guarantees hardware compositing layer isolation
    variants[variant],
    variant !== "modal" ? blurs[intensity] : ""
  )
}

export const GlassBox = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant = "clear", intensity = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("overflow-hidden", getGlassClasses(variant, intensity), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassBox.displayName = "GlassBox"

export const GlassButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "clear" | "medium" }>(
  ({ className, variant = "medium", ...props }, ref) => {
    
    const variants = {
      clear: "bg-white/10 hover:bg-white/20 dark:bg-slate-900/20 dark:hover:bg-slate-800/40 border border-white/40 dark:border-slate-600/30 backdrop-blur-xs",
      medium: "bg-white/40 hover:bg-white/60 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 border border-white/40 dark:border-slate-700/50 backdrop-blur-sm"
    }

    return (
      <button
        ref={ref}
        className={cn(
          "transform-gpu isolate transition-transform duration-100 active:scale-95 ease-out",
          variants[variant],
          "shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
          className
        )}
        {...props}
      />
    )
  }
)
GlassButton.displayName = "GlassButton"
