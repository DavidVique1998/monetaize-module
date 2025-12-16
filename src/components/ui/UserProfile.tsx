'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, User, LogOut, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSelector } from './LanguageSelector';
import { useTheme } from 'next-themes';

interface UserProfileProps {
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
  className?: string;
  isCollapsed?: boolean;
  onClick?: () => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isDanger?: boolean;
}

function MenuItem({ icon, label, onClick, isDanger = false }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
        "hover:bg-accent hover:scale-[1.02] hover:shadow-sm",
        "focus:outline-none",
        isDanger
          ? "text-destructive hover:text-destructive hover:bg-destructive/10"
          : "text-foreground hover:text-primary",
        "group"
      )}
    >
      <div className={cn(
        "mr-3 flex-shrink-0 transition-colors duration-200",
        isDanger ? "text-destructive group-hover:text-destructive" : "text-muted-foreground group-hover:text-primary"
      )}>
        {icon}
      </div>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

export function UserProfile({ 
  name, 
  email, 
  avatar, 
  initials = 'AL', 
  className,
  isCollapsed = false,
  onClick
}: UserProfileProps) {
  const router = useRouter();
  const t = useTranslations('userProfile');
  const { theme, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleToggleDropdown = () => {
    if (onClick) {
      onClick();
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleViewProfile = () => {
    setIsDropdownOpen(false);
    router.push('/profile');
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' // Asegurar que las cookies se incluyan en la petición
      });
      
      if (response.ok) {
        // Forzar recarga completa para limpiar cualquier estado en caché
        window.location.href = '/install_ghl';
      } else {
        console.error('Error logging out:', await response.text());
        // Aún así, intentar redirigir
        router.push('/install_ghl');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      // Aún así, intentar redirigir
      router.push('/install_ghl');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (isCollapsed) {
    return (
      <div 
        onClick={handleToggleDropdown}
        className={cn(
          "flex items-center justify-center p-2 hover:bg-accent rounded-lg transition-all duration-200 cursor-pointer group",
          className
        )}
      >
        {avatar ? (
          <img 
            src={avatar} 
            alt={name}
            className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
            <span className="text-xs font-medium text-primary-foreground">
              {initials}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <div 
        onClick={handleToggleDropdown}
        className={cn(
          "flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-all duration-200 cursor-pointer group",
          isDropdownOpen && "bg-accent",
          className
        )}
      >
        <div className="flex items-center">
          {avatar ? (
            <img 
              src={avatar} 
              alt={name}
              className="w-8 h-8 rounded-lg object-cover mr-3 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-3 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-200">
              <span className="text-xs font-medium text-primary-foreground">
                {initials}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{name}</span>
            <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">{email}</span>
          </div>
        </div>
        {isDropdownOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-xl py-2 z-50 transform transition-all duration-200 ease-out opacity-100 translate-y-0">
          <MenuItem
            icon={<User className="w-4 h-4" />}
            label={t('viewProfile')}
            onClick={handleViewProfile}
          />
          {mounted && (
            <MenuItem
              icon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              label={theme === 'dark' ? t('lightMode') : t('darkMode')}
              onClick={toggleTheme}
            />
          )}
          <div className="px-2 py-1">
            <LanguageSelector />
          </div>
          <MenuItem
            icon={<LogOut className="w-4 h-4" />}
            label={t('logout')}
            onClick={handleLogout}
            isDanger={true}
          />
        </div>
      )}
    </div>
  );
}
