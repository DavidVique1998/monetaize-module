'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface FunnelChartProps {
  title?: string;
  subtitle?: string;
  steps: FunnelStep[];
  className?: string;
}

export function FunnelChart({ 
  title = "Appointments", 
  subtitle = "Last 30 days",
  steps,
  className 
}: FunnelChartProps) {
  const maxValue = Math.max(...steps.map(step => step.value));
  
  return (
    <div className={cn(
      "bg-card rounded-lg border border-gray-200 p-6 shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <select className="appearance-none bg-transparent border-none text-lg font-semibold text-foreground focus:outline-none">
            <option>{title}</option>
            <option>Transfers</option>
            <option>Conversations</option>
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      </div>
      
      {/* Funnel Chart */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const width = (step.value / maxValue) * 100;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.label} className="relative">
              {/* Barra del embudo */}
              <div className="relative h-12 rounded-lg overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 ease-out",
                    step.color
                  )}
                  style={{ width: `${width}%` }}
                />
                
                {/* Texto sobre la barra */}
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">
                      {step.label}
                    </span>
                    <span className="text-sm text-white/80">
                      {step.value} {step.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {step.percentage}%
                  </span>
                </div>
              </div>
              
              {/* Conector hacia abajo (excepto el último) */}
              {!isLast && (
                <div className="flex justify-center mt-2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-300"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
