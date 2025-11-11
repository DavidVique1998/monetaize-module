import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfileProps {
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
  className?: string;
  isCollapsed?: boolean;
  onClick?: () => void;
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

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/profile');
    }
  };
  if (isCollapsed) {
    return (
      <div 
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer group",
          className
        )}
      >
        {avatar ? (
          <img 
            src={avatar} 
            alt={name}
            className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-200 group-hover:ring-blue-300 transition-all duration-200"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center ring-2 ring-blue-200 group-hover:ring-blue-300 transition-all duration-200">
            <span className="text-xs font-medium text-white">
              {initials}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer group",
        className
      )}
    >
      <div className="flex items-center">
        {avatar ? (
          <img 
            src={avatar} 
            alt={name}
            className="w-8 h-8 rounded-lg object-cover mr-3 ring-2 ring-blue-200 group-hover:ring-blue-300 transition-all duration-200"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 ring-2 ring-blue-200 group-hover:ring-blue-300 transition-all duration-200">
            <span className="text-xs font-medium text-white">
              {initials}
            </span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{name}</span>
          <span className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">{email}</span>
        </div>
      </div>
      <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
    </div>
  );
}
