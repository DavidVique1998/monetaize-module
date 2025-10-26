import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <div className={cn(
      "flex flex-col h-full w-64 bg-white border-r border-gray-200 shadow-lg",
      className
    )}>
      {children}
    </div>
  );
}

interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <div className={cn("flex items-center justify-center p-6 border-b border-gray-200 bg-gray-50", className)}>
      {children}
    </div>
  );
}

interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarContent({ children, className }: SidebarContentProps) {
  return (
    <div className={cn("flex-1 px-4 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent", className)}>
      {children}
    </div>
  );
}

interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div className={cn("p-4 border-t border-gray-200 bg-gray-50", className)}>
      {children}
    </div>
  );
}
