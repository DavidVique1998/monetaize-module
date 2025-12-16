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
  purple: 'text-primary',
  green: 'text-emerald-400',
  yellow: 'text-yellow-600',
  red: 'text-destructive',
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
      "bg-card rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow",
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
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
        </div>
        {showInfo && (
          <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
        )}
      </div>
    </div>
  );
}
