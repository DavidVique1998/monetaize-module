'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LineChartData {
  date: string;
  value: number;
}

interface LineChartProps {
  title: string;
  subtitle?: string;
  value: string;
  data: LineChartData[];
  color?: 'purple' | 'green' | 'blue' | 'yellow' | 'red' | 'orange';
  icon?: React.ReactNode;
  className?: string;
}

const colorClasses = {
  purple: 'text-primary bg-primary/10',
  green: 'text-emerald-400 bg-emerald-600/20',
  blue: 'text-primary bg-primary/10',
  yellow: 'text-yellow-600 bg-yellow-100',
  red: 'text-red-600 bg-red-100',
  orange: 'text-orange-600 bg-orange-100',
};

export function LineChart({ 
  title, 
  subtitle = "Last 30 days",
  value,
  data,
  color = 'purple',
  icon,
  className 
}: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  // Crear puntos para la línea
  const points = data.map((point, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={cn(
      "bg-card rounded-lg border border-gray-200 p-6 shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {icon && (
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center mr-3",
              colorClasses[color]
            )}>
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <span className="text-sm text-gray-500">{subtitle}</span>
      </div>
      
      {/* Value */}
      <div className="mb-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
      
      {/* Chart */}
      <div className="relative h-32">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          className="absolute inset-0"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Y-axis labels */}
          <text x="2" y="15" fontSize="8" fill="#6b7280" textAnchor="start">2</text>
          <text x="2" y="50" fontSize="8" fill="#6b7280" textAnchor="start">1</text>
          <text x="2" y="85" fontSize="8" fill="#6b7280" textAnchor="start">0</text>
          
          {/* X-axis labels */}
          {data.map((point, index) => {
            const xPosition = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
            return (
              <text 
                key={index}
                x={xPosition} 
                y="95" 
                fontSize="8" 
                fill="#6b7280" 
                textAnchor="middle"
              >
                {point.date}
              </text>
            );
          })}
          
          {/* Line */}
          <polyline
            fill="none"
            stroke={color === 'purple' ? 'var(--primary)' : 
                   color === 'green' ? '#10b981' :
                   color === 'blue' ? '#3b82f6' :
                   color === 'yellow' ? '#f59e0b' :
                   color === 'red' ? '#ef4444' :
                   color === 'orange' ? '#f97316' : '#8b5cf6'}
            strokeWidth="2"
            points={points}
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={color === 'purple' ? 'var(--primary)' : 
                      color === 'green' ? '#10b981' :
                      color === 'blue' ? '#3b82f6' :
                      color === 'yellow' ? '#f59e0b' :
                      color === 'red' ? '#ef4444' :
                      color === 'orange' ? '#f97316' : '#8b5cf6'}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
