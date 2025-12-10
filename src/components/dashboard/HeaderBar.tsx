'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Search, Bell, Link } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface HeaderBarProps {
  title: string;
  className?: string;
}

export function HeaderBar({ title, className }: HeaderBarProps) {
  const t = useTranslations('common');
  
  return (
    <div className={cn(
      "flex items-center justify-between px-6 py-4 bg-card border-b border-border",
      className
    )}>
      {/* Título */}
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      
      {/* Búsqueda y notificaciones */}
      <div className="flex items-center space-x-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`${t('search')}...`}
            className="pl-10 pr-4 py-2 w-64 border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
          />
        </div>
        
        {/* Iconos */}
        <div className="flex items-center space-x-3">
          <Link className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-bold shadow-sm">
              5878
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
