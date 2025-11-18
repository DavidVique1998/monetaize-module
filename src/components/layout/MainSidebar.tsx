'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Navigation } from '@/components/navigation/Navigation';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { RechargeModal } from '@/components/wallet/RechargeModal';
import { UserProfile } from '@/components/ui/UserProfile';
import { Phone, Pin, PinOff, Zap, ZapIcon, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'LOCATION';
  ghlLocationId: string | null;
  ghlCompanyId: string | null;
}

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const result = await response.json();
        
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          // Si no está autenticado, redirigir a install_ghl
          router.push('/install_ghl');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/install_ghl');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Generar iniciales del nombre o email
  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return null; // O un spinner
  }

  if (!user) {
    return null;
  }

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
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-lg shadow-md">
                <Coins className="w-5 h-5 text-white" />
              </div>
            </SidebarHeader>
            <SidebarContent className="py-2">
              <div className="flex flex-col items-center space-y-1">
                {/* Iconos de navegación */}
                <Navigation isCollapsed={true} />
                {/* Balance colapsado */}
                <WalletBalance 
                  isCollapsed={true}
                  onRechargeClick={() => setIsRechargeModalOpen(true)}
                />
              </div>
            </SidebarContent>
          </>
        ) : (
          <>
            {/* Header con logo de Monetaize */}
            <SidebarHeader>
              <div className="flex items-center space-x-3">
                <img src="/images/logo.png" alt="Monetaize"/>
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
                <WalletBalance 
                  isCollapsed={false}
                  onRechargeClick={() => setIsRechargeModalOpen(true)}
                />
                
                {/* Perfil de usuario */}
                <UserProfile 
                  name={user.name || user.email}
                  email={user.email}
                  initials={getInitials(user.name, user.email)}
                />
              </div>
            </SidebarFooter>
          </>
        )}
      </Sidebar>
      </div>
      
      {/* Modal de recarga */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        onSuccess={() => {
          // El balance se actualizará automáticamente
        }}
      />
    </>
  );
}
