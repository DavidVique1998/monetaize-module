'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface CamiaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  showGlow?: boolean;
  animated?: boolean;
  collapsed?: boolean; // Si es true, solo muestra "C"
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
  '2xl': 'text-6xl',
  '3xl': 'text-7xl',
  '4xl': 'text-8xl',
  '5xl': 'text-9xl',
};

export function CamiaLogo({ 
  size = 'lg', 
  className,
  showGlow = true,
  animated = false,
  collapsed = false
}: CamiaLogoProps): React.ReactNode {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <span
      className={cn(
        sizeClasses[size],
        "tracking-tight font-extrabold",
        animated && "transition-all duration-300 ease-in-out",
        className
      )}
      style={{
        fontFamily: 'var(--font-orbitron)',
        fontWeight: 800,
        color: isDark ? '#ffffff' : '#0f172a',
        textShadow: showGlow
          ? isDark
            ? '0 0 12px rgba(231, 22, 128, 1), 0 0 24px rgba(231, 22, 128, 0.6), 0 0 36px rgba(231, 22, 128, 0.3)'
            : '0 0 8px rgba(231, 22, 128, 0.8), 0 0 16px rgba(231, 22, 128, 0.5), 0 0 24px rgba(231, 22, 128, 0.3)'
          : 'none',
      }}
    >
      {collapsed ? 'C' : 'CAMIA'}
    </span>
  );
}
