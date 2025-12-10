'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { NewContactModal } from '@/components/contacts/NewContactModal';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { Search } from 'lucide-react';

export default function ContactsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full -50">
        {/* Header */}
        <HeaderBar title="Contacts" />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Top Bar with Search and Button */}
          <div className="flex items-center justify-between mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background"
              />
            </div>

            {/* New Contact Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              + New Contact
            </button>
          </div>

          {/* Contacts Table */}
          <ContactsTable />
        </div>

        {/* Modal */}
        <NewContactModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </DashboardLayout>
  );
}