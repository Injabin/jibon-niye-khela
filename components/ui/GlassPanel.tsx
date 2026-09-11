'use client';

import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  intensity?: 'subtle' | 'standard' | 'glow';
  as?: React.ElementType;
}

/**
 * Reusable Glassmorphism Surface Component.
 * Implements ultra-minimal dark glass aesthetic with subtle borders and specular lighting.
 */
export function GlassPanel({
  children,
  className = '',
  hoverEffect = false,
  intensity = 'standard',
  as: Component = 'div',
  ...props
}: GlassPanelProps) {
  const intensityClasses = {
    subtle: 'bg-white/[0.02] border-white/[0.04]',
    standard: 'bg-white/[0.04] border-white/[0.07]',
    glow: 'bg-white/[0.06] border-white/[0.12] shadow-[0_0_25px_rgba(255,255,255,0.02)]',
  };

  const hoverClasses = hoverEffect
    ? 'transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.14] hover:shadow-[0_8px_32px_rgba(0,0,0,0.36)]'
    : '';

  return (
    <Component
      className={`relative backdrop-blur-xl border rounded-2xl ${intensityClasses[intensity]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
