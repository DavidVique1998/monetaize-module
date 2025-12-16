'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderBarProps {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function HeaderBar({ title, description, actions, className }: HeaderBarProps) {
  return (
    <div className={cn(
      "px-6 py-5 bg-transparent flex items-start justify-between gap-4",
      className
    )}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground max-w-3xl">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
