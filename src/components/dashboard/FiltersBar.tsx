'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Search, Calendar, Filter } from 'lucide-react';

interface FiltersBarProps {
  className?: string;
}

export function FiltersBar({ className }: FiltersBarProps) {
  return (
    <div className={cn(
      "flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 gap-4",
      className
    )}>
      {/* Búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by number, name, ID, etc..."
          className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>
      
      {/* Filtros */}
      <div className="flex items-center space-x-3">
        {/* Filter by status */}
        <div className="relative">
          <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 min-w-[150px] text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Filter by status</option>
            <option>Completed</option>
            <option>In Progress</option>
            <option>Failed</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Filter by end reason */}
        <div className="relative">
          <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 min-w-[180px] text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Filter by end reason</option>
            <option>Customer hung up</option>
            <option>Agent ended</option>
            <option>System error</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Filter by sentiment */}
        <div className="relative">
          <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 min-w-[160px] text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Filter by sentiment</option>
            <option>Positive</option>
            <option>Neutral</option>
            <option>Negative</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Fechas */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            defaultValue="2025-09-25"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
          />
          <span className="text-sm text-gray-500">to</span>
          <input
            type="date"
            defaultValue="2025-10-25"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
