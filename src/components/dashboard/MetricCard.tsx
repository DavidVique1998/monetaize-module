'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color?: 'purple' | 'green' | 'yellow' | 'red' | 'orange' | 'blue' | 'brown';
  showInfo?: boolean;
  className?: string;
}

const colorClasses = {
  purple: 'text-purple-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
  orange: 'text-orange-600',
  blue: 'text-blue-600',
  brown: 'text-amber-700',
};

export function MetricCard({ 
  icon, 
  title, 
  value, 
  color = 'purple', 
  showInfo = false,
  className 
}: MetricCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={cn(
            "mr-3 flex-shrink-0",
            colorClasses[color]
          )}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        </div>
        {showInfo && (
          <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors cursor-help" />
        )}
      </div>
    </div>
  );
}
