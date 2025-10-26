import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface GenericPageProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function GenericPage({ title, description, children }: GenericPageProps) {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          {description && (
            <p className="text-gray-600 text-lg mb-8">{description}</p>
          )}
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
