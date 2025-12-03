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
      "flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200",
      className
    )}>
      {/* Título */}
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      
      {/* Búsqueda y notificaciones */}
      <div className="flex items-center space-x-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`${t('search')}...`}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        
        {/* Iconos */}
        <div className="flex items-center space-x-3">
          <Link className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              5878
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
