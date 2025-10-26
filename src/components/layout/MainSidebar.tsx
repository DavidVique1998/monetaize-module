'use client';

import React from 'react';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Navigation } from '@/components/navigation/Navigation';
import { BalanceCard } from '@/components/ui/BalanceCard';
import { UserProfile } from '@/components/ui/UserProfile';
import { Phone, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainSidebarProps {
  className?: string;
  isCollapsed?: boolean;
  isVisible?: boolean;
  isPinned?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onTogglePin?: () => void;
}

export function MainSidebar({ 
  className, 
  isCollapsed = false, 
  isVisible = true, 
  isPinned = false,
  onMouseEnter,
  onMouseLeave,
  onTogglePin
}: MainSidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full transition-all duration-300 ease-in-out z-50",
          !isVisible ? "w-12" : "w-64",
          className
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Sidebar className={cn(
          "transition-all duration-300 ease-in-out h-full",
          !isVisible ? "w-12" : "w-64"
        )}>
        {/* Mode collapsed: solo mostrar iconos */}
        {!isVisible ? (
          <>
            <SidebarHeader className="p-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                <Phone className="w-5 h-5 text-white" />
              </div>
            </SidebarHeader>
            <SidebarContent className="py-2">
              <div className="flex flex-col items-center space-y-1">
                {/* Iconos de navegación */}
                <Navigation isCollapsed={true} />
              </div>
            </SidebarContent>
          </>
        ) : (
          <>
            {/* Header con logo de Monetaize */}
            <SidebarHeader>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800">Monetaize</span>
                  <span className="text-xs text-gray-500 font-medium">Agente de llamada</span>
                </div>
              </div>
              
              {/* Botón de pin */}
              <button
                onClick={onTogglePin}
                className={cn(
                  "absolute top-4 right-4 p-1 transition-all duration-200 cursor-pointer",
                  "hover:scale-110",
                  "focus:outline-none",
                  isPinned 
                    ? "text-blue-600 hover:text-blue-700" 
                    : "text-gray-500 hover:text-gray-700"
                )}
                title={isPinned ? "Desanclar sidebar" : "Anclar sidebar"}
              >
                {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              </button>
            </SidebarHeader>

            {/* Contenido principal con navegación */}
            <SidebarContent>
              <Navigation />
            </SidebarContent>

            {/* Footer con balance y perfil */}
            <SidebarFooter>
              <div className="space-y-4">
                {/* Balance */}
                <BalanceCard balance={-3.13} />
                
                {/* Perfil de usuario */}
                <UserProfile 
                  name="Current user"
                  email="escobarf1999@gmail.com"
                  initials="AL"
                />
              </div>
            </SidebarFooter>
          </>
        )}
      </Sidebar>
      </div>
    </>
  );
}
