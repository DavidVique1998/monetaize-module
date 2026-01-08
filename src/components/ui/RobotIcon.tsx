import React from 'react';
import { cn } from '@/lib/utils';

interface RobotIconProps {
  className?: string;
}

export function RobotIcon({ className }: RobotIconProps): React.ReactNode {
  return (
    <div className={cn(
      "w-12 h-12 relative group",
      className
    )}>
      {/* Cabeza del robot */}
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg relative shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Cara */}
        <div className="absolute inset-1 bg-gradient-to-br from-blue-300 to-blue-400 rounded-md">
          {/* Ojos */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full shadow-sm group-hover:bg-red-400 transition-colors"></div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-sm group-hover:bg-red-400 transition-colors"></div>
          
          {/* Boca */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-1 -700 rounded-full group-hover:bg-gray-600 transition-colors"></div>
        </div>
        
        {/* Antena */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-full shadow-sm group-hover:from-yellow-300 group-hover:to-yellow-200 transition-all duration-300"></div>
        
        {/* Efecto de pulso en la antena */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-50 group-hover:animate-pulse"></div>
      </div>
    </div>
  );
}
