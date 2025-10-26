'use client';

import { useState, useEffect } from 'react';

export function useSidebarState() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Determinar si el sidebar debe estar visible
  const isVisible = isPinned || isHovered;
  
  // isCollapsed es el opuesto de isExpanded
  const isCollapsed = !isExpanded;
  
  // Cuando se hace hover, expandir
  useEffect(() => {
    if (isVisible) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [isVisible]);

  // Función para toggle del pin
  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  // Función para manejar hover
  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovered(false);
    }
  };

  // Efecto para manejar el estado inicial
  useEffect(() => {
    // Opcional: cargar estado desde localStorage
    const savedPinState = localStorage.getItem('sidebar-pinned');
    if (savedPinState) {
      setIsPinned(JSON.parse(savedPinState));
    }
  }, []);

  // Efecto para guardar estado del pin
  useEffect(() => {
    localStorage.setItem('sidebar-pinned', JSON.stringify(isPinned));
  }, [isPinned]);

  return {
    isCollapsed,
    isVisible,
    isPinned,
    isHovered,
    togglePin,
    handleMouseEnter,
    handleMouseLeave,
  };
}
