'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSidebarNavigation } from '@/hooks/useSidebarNavigation';
import { 
  Inbox, 
  Phone, 
  Users, 
  BookOpen, 
  UserPlus, 
  Tag, 
  Smartphone, 
  ChevronDown,
  ChevronRight,
  Grid3X3,
  Settings,
  HelpCircle,
  Hash,
  ShoppingBag
} from 'lucide-react';

interface NavigationItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  hasDropdown?: boolean;
  isDropdownOpen?: boolean;
  onClick?: () => void;
  onDropdownToggle?: () => void;
  className?: string;
  isCollapsed?: boolean;
}

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function DropdownItem({ icon, label, isActive = false, onClick }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center px-8 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
        "hover:bg-blue-50 hover:text-blue-700 hover:scale-[1.02] hover:shadow-sm",
        "focus:outline-none",
        isActive 
          ? "bg-blue-100 text-blue-800 shadow-sm" 
          : "text-gray-600",
        "group"
      )}
    >
      <div className={cn(
        "mr-3 flex-shrink-0 transition-colors duration-200",
        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
      )}>
        {icon}
      </div>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

export function NavigationItem({ 
  icon, 
  label, 
  isActive = false, 
  hasDropdown = false,
  isDropdownOpen = false,
  onClick,
  onDropdownToggle,
  className,
  isCollapsed = false
}: NavigationItemProps) {
  const handleClick = () => {
    if (hasDropdown && onDropdownToggle) {
      onDropdownToggle();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
          "hover:bg-blue-50 hover:text-blue-700 hover:scale-[1.02] hover:shadow-sm",
          "focus:outline-none",
          "group relative overflow-hidden",
          isActive 
            ? "bg-blue-100 text-blue-800 shadow-sm" 
            : "text-gray-700 hover:text-blue-700",
          className
        )}
      >
        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className={cn(
          "mr-3 flex-shrink-0 relative z-10 transition-all duration-200",
          isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
        )}>
          {icon}
        </div>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left relative z-10">{label}</span>
            {hasDropdown && (
              <div className="relative z-10 transition-transform duration-200">
                {isDropdownOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                )}
              </div>
            )}
          </>
        )}
      </button>
    </div>
  );
}

interface NavigationGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function NavigationGroup({ children, className }: NavigationGroupProps) {
  return (
    <div className={cn("space-y-1 mb-6", className)}>
      {children}
    </div>
  );
}

export function Navigation({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { navigationItems, activeItem, openDropdowns, handleNavigationClick, toggleDropdown } = useSidebarNavigation();

  const handleDropdownItemClick = (subItem: any) => {
    // Navegar a la subopción pero mantener el dropdown abierto
    handleNavigationClick(subItem);
    // No cerrar el dropdown, mantenerlo abierto
  };

  // Mapear nombres de iconos a componentes JSX
  const iconMap: Record<string, React.ReactNode> = {
    'inbox': <Inbox className="w-5 h-5" />,
    'phone': <Phone className="w-5 h-5" />,
    'users': <Users className="w-5 h-5" />,
    'book-open': <BookOpen className="w-5 h-5" />,
    'user-plus': <UserPlus className="w-5 h-5" />,
    'tag': <Tag className="w-5 h-5" />,
    'smartphone': <Smartphone className="w-5 h-5" />,
    'grid-3x3': <Grid3X3 className="w-5 h-5" />,
    'settings': <Settings className="w-5 h-5" />,
    'help-circle': <HelpCircle className="w-5 h-5" />,
    'hash': <Hash className="w-5 h-5" />,
    'installer': <ShoppingBag className="w-5 h-5" />,
  };

  // Modo colapsado: solo iconos
  if (isCollapsed) {
    return (
      <nav className="space-y-1">
        {navigationItems.map((item) => {
          // Verificar si el item principal o alguna de sus subopciones está activa
          const isActive = activeItem === item.id || 
            (item.subItems?.some(subItem => activeItem === subItem.id));
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigationClick(item)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-blue-100 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {iconMap[item.iconName]}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-6">
      {/* Primera sección */}
      <NavigationGroup>
        {navigationItems.slice(0, 3).map((item) => (
          <div key={item.id}>
            <NavigationItem
              icon={iconMap[item.iconName]}
              label={item.label}
              isActive={activeItem === item.id}
              hasDropdown={item.hasDropdown}
              isDropdownOpen={openDropdowns[item.id]}
              onClick={() => !item.hasDropdown && handleNavigationClick(item)}
              onDropdownToggle={() => item.hasDropdown && toggleDropdown(item.id)}
              isCollapsed={isCollapsed}
            />
            
            {/* Dropdown solo para Numbers */}
            {item.hasDropdown && item.id === 'phone-numbers' && openDropdowns[item.id] && !isCollapsed && (
              <div className="mt-2 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {item.subItems?.map((subItem) => (
                  <DropdownItem
                    key={subItem.id}
                    icon={iconMap[subItem.iconName]}
                    label={subItem.label}
                    isActive={activeItem === subItem.id}
                    onClick={() => handleDropdownItemClick(subItem)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </NavigationGroup>

      {/* Segunda sección */}
      <NavigationGroup>
        {navigationItems.slice(3, 8).map((item) => (
          <div key={item.id}>
            <NavigationItem
              icon={iconMap[item.iconName]}
              label={item.label}
              isActive={activeItem === item.id}
              hasDropdown={item.hasDropdown}
              isDropdownOpen={openDropdowns[item.id]}
              onClick={() => !item.hasDropdown && handleNavigationClick(item)}
              onDropdownToggle={() => item.hasDropdown && toggleDropdown(item.id)}
              isCollapsed={isCollapsed}
            />
            
            {/* Dropdown solo para Numbers */}
            {item.hasDropdown && item.id === 'phone-numbers' && openDropdowns[item.id] && !isCollapsed && (
              <div className="mt-2 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {item.subItems?.map((subItem) => (
                  <DropdownItem
                    key={subItem.id}
                    icon={iconMap[subItem.iconName]}
                    label={subItem.label}
                    isActive={activeItem === subItem.id}
                    onClick={() => handleDropdownItemClick(subItem)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </NavigationGroup>

      {/* Tercera sección */}
      <NavigationGroup>
        {navigationItems.slice(8).map((item) => (
          <div key={item.id}>
            <NavigationItem
              icon={iconMap[item.iconName]}
              label={item.label}
              isActive={activeItem === item.id}
              hasDropdown={item.hasDropdown}
              isDropdownOpen={openDropdowns[item.id]}
              onClick={() => !item.hasDropdown && handleNavigationClick(item)}
              onDropdownToggle={() => item.hasDropdown && toggleDropdown(item.id)}
              isCollapsed={isCollapsed}
            />
            
            {/* Dropdown solo para Numbers */}
            {item.hasDropdown && item.id === 'phone-numbers' && openDropdowns[item.id] && !isCollapsed && (
              <div className="mt-2 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {item.subItems?.map((subItem) => (
                  <DropdownItem
                    key={subItem.id}
                    icon={iconMap[subItem.iconName]}
                    label={subItem.label}
                    isActive={activeItem === subItem.id}
                    onClick={() => handleDropdownItemClick(subItem)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </NavigationGroup>
    </nav>
  );
}
