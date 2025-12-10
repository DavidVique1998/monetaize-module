'use client';

import React from 'react';
import { MainSidebar } from '@/components/layout/MainSidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="flex h-screen -50">
      {/* Sidebar izquierdo */}
      <MainSidebar />
      
      {/* Contenido principal */}
      <main className={cn(
        "flex-1 overflow-auto",
        className
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
