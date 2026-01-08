import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ActiveTagsPage(): React.ReactNode {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Active Tags</h1>
          <p className="text-gray-600 text-lg">
            Gestión de etiquetas y categorías activas
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
