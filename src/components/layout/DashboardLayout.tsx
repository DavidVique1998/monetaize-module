'use client';

import React from 'react';
import { MainSidebar } from '@/components/layout/MainSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const {
    isCollapsed,
    isVisible,
    isPinned,
    togglePin,
    setHovered,
  } = useSidebar();

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors">
      {/* Sidebar */}
      <MainSidebar 
        isCollapsed={isCollapsed}
        isVisible={isVisible}
        isPinned={isPinned}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTogglePin={togglePin}
      />
      
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-auto bg-background text-foreground transition-colors",
        isPinned ? "pl-64" : "pl-12"
      )}>
        <div className="flex-1 bg-background text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
