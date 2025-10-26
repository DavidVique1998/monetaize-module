'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  title: string;
  subtitle?: string;
  data: PieChartData[];
  className?: string;
}

export function PieChart({ 
  title, 
  subtitle = "Last 30 days",
  data,
  className 
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calcular ángulos para cada segmento
  let cumulativeAngle = 0;
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    
    cumulativeAngle += angle;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      index
    };
  });

  // Crear path para el SVG
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(100, 100, radius, endAngle);
    const end = polarToCartesian(100, 100, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", 100, 100,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-6 shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{subtitle}</span>
      </div>
      
      {/* Pie Chart */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="transform -rotate-90"
          >
            {segments.map((segment) => (
              <path
                key={segment.index}
                d={createArcPath(segment.startAngle, segment.endAngle, 80)}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>
          
          {/* Centro del gráfico */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-gray-700">{total}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Leyenda */}
      <div className="mt-4 space-y-2">
        {segments.map((segment) => (
          <div key={segment.index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-gray-600">{segment.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {segment.value} ({segment.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
