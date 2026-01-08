'use client';

import React from 'react';
import { MainSidebar } from '@/components/layout/MainSidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps): React.ReactNode {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar izquierdo */}
      <MainSidebar />
      
      {/* Contenido principal */}
      <main className={cn(
        "flex-1 overflow-auto bg-background text-foreground",
        className
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
