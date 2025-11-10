'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  hasDropdown?: boolean;
  subItems?: SubNavigationItem[];
}

export interface SubNavigationItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
}

export function useSidebarNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState<string>('');
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Definir los elementos de navegación (solo Numbers tiene subopciones)
  const navigationItems: NavigationItem[] = [
    // Primera sección
    { id: 'inbox', label: 'Inbox', href: '/inbox', iconName: 'inbox' },
    { id: 'call-center', label: 'Call Center', href: '/call-center', iconName: 'phone' },
    { id: 'contacts', label: 'Contacts', href: '/contacts', iconName: 'users' },
    
    // Segunda sección
    { id: 'knowledge', label: 'Knowledge', href: '/knowledge', iconName: 'book-open' },
    { id: 'assistants', label: 'Assistants', href: '/assistants', iconName: 'user-plus' },
    { id: 'active-tags', label: 'Active Tags', href: '/active-tags', iconName: 'tag' },
    { 
      id: 'phone-numbers', 
      label: 'Numbers', 
      href: '/phone-numbers', 
      iconName: 'smartphone', 
      hasDropdown: true,
      subItems: [
        { id: 'numbers-all', label: 'All Numbers', href: '/phone-numbers', iconName: 'hash' },
        { id: 'numbers-pools', label: 'Pools', href: '/phone-numbers/pools', iconName: 'grid-3x3' }
      ]
    },
    { id: 'widgets', label: 'Widgets', href: '/widgets', iconName: 'grid-3x3' },
    { id: 'installer', label: 'Installer', href: '/installer', iconName: 'installer' },
    // Tercera sección
    { id: 'settings', label: 'Settings', href: '/settings', iconName: 'settings' },
    { id: 'help', label: 'Help', href: '/help', iconName: 'help-circle' },
  ];

  // Detectar el elemento activo basado en la ruta actual
  useEffect(() => {
    // Buscar el elemento principal activo
    const currentItem = navigationItems.find(item => 
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
    
    // Si estamos en una subopción, buscar la subsección específica
    if (currentItem?.hasDropdown && currentItem.subItems) {
      const activeSubItem = currentItem.subItems.find(subItem => 
        pathname === subItem.href || pathname.startsWith(subItem.href + '/')
      );
      
      if (activeSubItem) {
        // Si hay una subsección activa, marcar esa como activa
        setActiveItem(activeSubItem.id);
        // Mantener el dropdown abierto
        setOpenDropdowns(prev => ({
          ...prev,
          [currentItem.id]: true
        }));
      } else {
        // Si estamos en la página principal del dropdown, marcar el elemento principal
        setActiveItem(currentItem.id);
      }
    } else {
      // Para elementos sin dropdown, marcar normalmente
      setActiveItem(currentItem?.id || '');
    }
  }, [pathname]);

  // Función para navegar
  const navigateTo = (href: string) => {
    router.push(href);
  };

  // Función para manejar clics en elementos de navegación
  const handleNavigationClick = (item: NavigationItem) => {
    navigateTo(item.href);
  };

  // Función para toggle del dropdown
  const toggleDropdown = (itemId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return {
    navigationItems,
    activeItem,
    openDropdowns,
    navigateTo,
    handleNavigationClick,
    toggleDropdown,
  };
}
