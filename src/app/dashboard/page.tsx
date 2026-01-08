import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Panel de administración de Retell AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Agentes</h3>
            <p className="text-gray-600">Gestiona tus agentes de llamada</p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Voces</h3>
            <p className="text-gray-600">Configura las voces disponibles</p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Números</h3>
            <p className="text-gray-600">Administra números de teléfono</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Llamada completada</span>
              <span className="text-xs text-gray-500">Hace 5 minutos</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Agente creado</span>
              <span className="text-xs text-gray-500">Hace 1 hora</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Número importado</span>
              <span className="text-xs text-gray-500">Hace 2 horas</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
