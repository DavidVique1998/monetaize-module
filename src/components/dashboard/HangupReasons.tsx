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
      "bg-white rounded-lg border border-gray-200 p-6 shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{subtitle}</span>
      </div>
      
      {/* Content */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No hangup data available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((reason, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">{reason.reason}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{reason.count}</div>
                <div className="text-xs text-gray-500">{reason.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
