'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export function ContactsTable() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-gray-700">
          <div>NAME</div>
          <div>EMAIL</div>
          <div>PHONE</div>
          <div>ID</div>
          <div>INTERACTIONS</div>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">No contacts to display</p>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <select className="appearance-none px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>10</option>
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
          <span className="text-sm text-gray-600">Showing 1 - 10</span>
          <span className="text-sm text-gray-600">0 Results</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Page 1 of 1</span>
          <button 
            disabled
            className="p-2 text-gray-400 cursor-not-allowed"
          >
            ←
          </button>
          <button 
            disabled
            className="p-2 text-gray-400 cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
