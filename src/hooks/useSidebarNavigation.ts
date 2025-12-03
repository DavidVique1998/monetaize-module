'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('navigation');
  const [activeItem, setActiveItem] = useState<string>('');
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Definir los elementos de navegación (solo Numbers tiene subopciones)
  const navigationItems: NavigationItem[] = [
    // Primera sección
    // { id: 'inbox', label: t('inbox'), href: '/inbox', iconName: 'inbox' },
    // { id: 'call-center', label: t('callCenter'), href: '/call-center', iconName: 'phone' },
    { id: 'contacts', label: t('contacts'), href: '/contacts', iconName: 'users' },
    
    // Segunda sección
    { id: 'knowledge', label: t('knowledge'), href: '/knowledge', iconName: 'book-open' },
    { id: 'assistants', label: t('assistants'), href: '/assistants', iconName: 'user-plus' },
    { id: 'phone-numbers', label: t('phoneNumbers'), href: '/phone-numbers', iconName: 'smartphone' },
    { id: 'call-history', label: t('callHistory'), href: '/call-history', iconName: 'phone' },
    // { id: 'active-tags', label: 'Active Tags', href: '/active-tags', iconName: 'tag' },
    // { id: 'widgets', label: 'Widgets', href: '/widgets', iconName: 'grid-3x3' },
    // Tercera sección
    { id: 'wallet', label: t('wallet'), href: '/wallet', iconName: 'wallet' },
    { id: 'settings', label: t('settings'), href: '/settings', iconName: 'settings' },
    { id: 'help', label: t('help'), href: '/help', iconName: 'help-circle' },
  ];

  // Detectar el elemento activo basado en la ruta actual
  useEffect(() => {
    // Buscar el elemento principal activo
    const currentItem = navigationItems.find(item => 
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
    
    // Si estamos en una subopción, buscar la subsección específica
    if (currentItem?.hasDropdown && currentItem.subItems) {
      // Bug 1 Fix: Si el pathname coincide exactamente con el href del padre,
      // usar el elemento padre en lugar de buscar subitems
      if (pathname === currentItem.href) {
        setActiveItem(currentItem.id);
        setOpenDropdowns(prev => ({
          ...prev,
          [currentItem.id]: true
        }));
        return;
      }
      
      // Bug 2 Fix: Ordenar subitems por especificidad (más específicos primero)
      // 1. Coincidencias exactas primero
      // 2. Luego por longitud de href (más largo = más específico)
      const sortedSubItems = [...currentItem.subItems].sort((a, b) => {
        const aExact = pathname === a.href;
        const bExact = pathname === b.href;
        
        // Priorizar coincidencias exactas
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Si ambos o ninguno son exactos, ordenar por longitud (más largo primero)
        return b.href.length - a.href.length;
      });
      
      // Buscar el subitem activo (ya ordenado por especificidad)
      const activeSubItem = sortedSubItems.find(subItem => 
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
        // Si no hay subitem activo, usar el elemento principal
        setActiveItem(currentItem.id);
        setOpenDropdowns(prev => ({
          ...prev,
          [currentItem.id]: true
        }));
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
