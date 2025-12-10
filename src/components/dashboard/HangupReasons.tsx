'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface HangupReason {
  reason: string;
  count: number;
  percentage: number;
}

interface HangupReasonsProps {
  title?: string;
  subtitle?: string;
  data: HangupReason[];
  className?: string;
}

export function HangupReasons({ 
  title = "Hangup Reasons",
  subtitle = "Last 30 days",
  data,
  className 
}: HangupReasonsProps) {
  return (
    <div className={cn(
      "bg-card rounded-lg border border-gray-200 p-6 shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      </div>
      
      {/* Content */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">No hangup data available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((reason, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-redbg-muted/300 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-muted-foreground">{reason.reason}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">{reason.count}</div>
                <div className="text-xs text-muted-foreground">{reason.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
