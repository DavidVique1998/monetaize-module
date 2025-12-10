'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AgentDebugPanel } from '@/components/debug/AgentDebugPanel';
import { ArrowLeft, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AgentDebugPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-card">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/assistants')}
              className="p-1 hover:bg-muted rounded transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Agent Debug Tools</h1>
                <p className="text-sm text-gray-500">
                  Diagnose and fix agent ownership issues
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                ¿Tienes problemas editando agentes?
              </h2>
              <div className="text-blue-800 space-y-2">
                <p>
                  Si ves el error <strong>"Agent not found or does not belong to your account"</strong>, 
                  es probable que tus agentes de Retell no estén correctamente vinculados con tu cuenta.
                </p>
                <p>
                  Esta herramienta te ayudará a:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Ver qué agentes tienes en Retell AI</li>
                  <li>Identificar agentes no vinculados</li>
                  <li>Vincular agentes automáticamente</li>
                  <li>Sincronizar todos los agentes de una vez</li>
                </ul>
              </div>
            </div>

            {/* Debug Panel */}
            <AgentDebugPanel />

            {/* Additional Help */}
            <div className="bg-muted border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ¿Necesitas más ayuda?
              </h3>
              <div className="text-gray-700 space-y-2">
                <p>
                  Si después de usar estas herramientas sigues teniendo problemas:
                </p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Verifica que tu API key de Retell esté configurada correctamente</li>
                  <li>Asegúrate de que los agentes existan en tu cuenta de Retell AI</li>
                  <li>Intenta crear un nuevo agente desde cero</li>
                  <li>Contacta al soporte técnico si el problema persiste</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
