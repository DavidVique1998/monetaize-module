'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isPinned: boolean;
  isHovered: boolean;
  togglePin: () => void;
  setHovered: (hovered: boolean) => void;
  isVisible: boolean;
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Cargar estado desde localStorage al iniciar
  useEffect(() => {
    const savedPinState = localStorage.getItem('sidebar-pinned');
    if (savedPinState) {
      try {
        setIsPinned(JSON.parse(savedPinState));
      } catch (e) {
        // Ignorar error de parsing
      }
    }
  }, []);

  // Guardar estado cuando cambia
  useEffect(() => {
    localStorage.setItem('sidebar-pinned', JSON.stringify(isPinned));
  }, [isPinned]);

  // Cuando se hace visible, expandir
  const isVisible = isPinned || isHovered;
  
  useEffect(() => {
    if (isVisible) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [isVisible]);

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  const setHovered = (hovered: boolean) => {
    if (!isPinned) {
      setIsHovered(hovered);
    }
  };

  const isCollapsed = !isExpanded;

  return (
    <SidebarContext.Provider value={{
      isPinned,
      isHovered,
      togglePin,
      setHovered,
      isVisible,
      isCollapsed,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

