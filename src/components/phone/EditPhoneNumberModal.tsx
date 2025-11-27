'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { ChevronRight, Phone, Save, AlertCircle } from 'lucide-react';
import { ImportedPhoneNumber } from '@/lib/retell';

const editPhoneNumberSchema = z.object({
  // Campos editables
  inbound_agent_id: z.string().optional(),
  outbound_agent_id: z.string().optional(),
  inbound_agent_version: z.number().min(1).optional(),
  outbound_agent_version: z.number().min(1).optional(),
  nickname: z.string().optional(),
  inbound_webhook_url: z.string().url().optional().or(z.literal('')),
});

type EditPhoneNumberFormData = z.infer<typeof editPhoneNumberSchema>;

interface EditPhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phoneNumber: any) => void;
  phoneNumber: ImportedPhoneNumber | null;
  agents?: Array<{ agent_id: string; agent_name: string }>;
}

export function EditPhoneNumberModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  phoneNumber,
  agents = [] 
}: EditPhoneNumberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EditPhoneNumberFormData>({
    resolver: zodResolver(editPhoneNumberSchema),
    defaultValues: {
      nickname: '',
      inbound_agent_id: '',
      outbound_agent_id: '',
      inbound_agent_version: undefined,
      outbound_agent_version: undefined,
      inbound_webhook_url: '',
    },
  });

  // Cargar datos del número telefónico cuando se abre el modal
  useEffect(() => {
    if (isOpen && phoneNumber) {
      setValue('nickname', phoneNumber.nickname || '');
      setValue('inbound_agent_id', phoneNumber.inbound_agent_id || '');
      setValue('outbound_agent_id', phoneNumber.outbound_agent_id || '');
      setValue('inbound_agent_version', phoneNumber.inbound_agent_version || undefined);
      setValue('outbound_agent_version', phoneNumber.outbound_agent_version || undefined);
      setValue('inbound_webhook_url', phoneNumber.inbound_webhook_url || '');
      setError(null);
    }
  }, [isOpen, phoneNumber, setValue]);

  const onSubmit = async (data: EditPhoneNumberFormData) => {
    if (!phoneNumber?.phone_number) {
      setError('Número de teléfono no válido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Preparar datos para el backend (solo enviar campos que tienen valor)
      const requestData: any = {
        ...(data.inbound_agent_id && { inbound_agent_id: data.inbound_agent_id }),
        ...(data.outbound_agent_id && { outbound_agent_id: data.outbound_agent_id }),
        ...(data.inbound_agent_version && { inbound_agent_version: data.inbound_agent_version }),
        ...(data.outbound_agent_version && { outbound_agent_version: data.outbound_agent_version }),
        ...(data.nickname !== undefined && { nickname: data.nickname || null }),
        ...(data.inbound_webhook_url && { inbound_webhook_url: data.inbound_webhook_url }),
      };

      // Llamada al endpoint del backend
      const response = await fetch(`/api/phone-numbers/${encodeURIComponent(phoneNumber.phone_number)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('Phone number updated successfully:', result.data);
      
      onSuccess?.(result.data);
      reset();
      onClose();
    } catch (err) {
      console.error('Error updating phone number:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el número de teléfono');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !phoneNumber) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar Modal */}
      <div 
        className={cn(
          "absolute right-0 top-0 h-full w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editar Número de Teléfono</h2>
              <p className="text-sm text-gray-500">
                {phoneNumber.phone_number_pretty || phoneNumber.phone_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Información del número (solo lectura) */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Número:</span>
              <span className="text-sm text-gray-900">{phoneNumber.phone_number_pretty || phoneNumber.phone_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Tipo:</span>
              <span className="text-sm text-gray-900">{phoneNumber.phone_number_type || 'custom'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname
              </label>
              <input
                {...register('nickname')}
                type="text"
                placeholder="Frontdesk Number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Agents */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Configuración de Agentes</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agente Entrante
                  </label>
                  <select
                    {...register('inbound_agent_id')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Ninguno</option>
                    {agents.map((agent, index) => (
                      <option key={`edit-inbound-${agent.agent_id}-${index}`} value={agent.agent_id}>
                        {agent.agent_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agente Saliente
                  </label>
                  <select
                    {...register('outbound_agent_id')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Ninguno</option>
                    {agents.map((agent, index) => (
                      <option key={`edit-outbound-${agent.agent_id}-${index}`} value={agent.agent_id}>
                        {agent.agent_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agent Versions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versión Agente Entrante
                  </label>
                  <input
                    {...register('inbound_agent_version', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    placeholder="Última versión"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Dejar vacío para usar la última versión
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versión Agente Saliente
                  </label>
                  <input
                    {...register('outbound_agent_version', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    placeholder="Última versión"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Dejar vacío para usar la última versión
                  </p>
                </div>
              </div>
            </div>

            {/* Inbound Webhook */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inbound Webhook URL
              </label>
              <input
                {...register('inbound_webhook_url')}
                type="url"
                placeholder="https://example.com/inbound-webhook"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              {errors.inbound_webhook_url && (
                <p className="mt-1 text-sm text-red-600">{errors.inbound_webhook_url.message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

