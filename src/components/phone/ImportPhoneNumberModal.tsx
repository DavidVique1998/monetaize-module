'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Phone, Plus, AlertCircle } from 'lucide-react';

const phoneNumberSchema = z.object({
  // Tipo de operación: 'create' o 'import'
  operation_type: z.enum(['create', 'import']),
  
  // Campo requerido para crear número nuevo
  area_code: z.number()
    .min(100, 'Código de área debe ser de 3 dígitos')
    .max(999, 'Código de área debe ser de 3 dígitos')
    .optional(),
  
  // Campo requerido para importar número existente
  phone_number: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Debe estar en formato E.164 (ej: +14157774444)')
    .optional()
    .or(z.literal('')),
  
  // Campos requeridos para importar (según documentación Retell AI)
  termination_uri: z.string()
    .min(1, 'Termination URI es requerido para importar')
    .optional()
    .or(z.literal('')),
  sip_trunk_auth_username: z.string().optional().or(z.literal('')),
  sip_trunk_auth_password: z.string().optional().or(z.literal('')),
  
  // Campos de agentes
  inbound_agent_id: z.string().optional(),
  outbound_agent_id: z.string().optional(),
  inbound_agent_version: z.number().min(1).optional(),
  outbound_agent_version: z.number().min(1).optional(),
  
  // Campos opcionales
  nickname: z.string().optional(),
  inbound_webhook_url: z.string().url().optional().or(z.literal('')),
  number_provider: z.enum(['twilio', 'telnyx']).optional(),
  country_code: z.enum(['US', 'CA']).optional(),
  toll_free: z.boolean().optional(),
}).refine((data) => {
  // Validación condicional según el tipo de operación
  if (data.operation_type === 'create') {
    return !!data.area_code; // area_code es requerido para crear
  } else {
    return !!data.phone_number && !!data.termination_uri; // phone_number y termination_uri son requeridos para importar
  }
}, {
  message: 'Los campos requeridos no están completos',
  path: ['operation_type'],
});

type PhoneNumberFormData = z.infer<typeof phoneNumberSchema>;

interface ImportPhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phoneNumber: any) => void;
  agents?: Array<{ agent_id: string; agent_name: string }>;
}

export function ImportPhoneNumberModal({ isOpen, onClose, onSuccess, agents = [] }: ImportPhoneNumberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<PhoneNumberFormData>({
    resolver: zodResolver(phoneNumberSchema),
    defaultValues: {
      operation_type: 'import',
      inbound_agent_version: 1,
      outbound_agent_version: 1,
      nickname: '',
      number_provider: 'twilio',
      country_code: 'US',
      toll_free: false,
    },
  });

  const watchedOperationType = watch('operation_type');
  const watchedPhoneNumber = watch('phone_number');

  const onSubmit = async (data: PhoneNumberFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Preparar datos para el backend según el tipo de operación
      const requestData: any = {
        // Campos de agentes
        ...(data.inbound_agent_id && { inbound_agent_id: data.inbound_agent_id }),
        ...(data.outbound_agent_id && { outbound_agent_id: data.outbound_agent_id }),
        ...(data.inbound_agent_version && { inbound_agent_version: data.inbound_agent_version }),
        ...(data.outbound_agent_version && { outbound_agent_version: data.outbound_agent_version }),
        
        // Campos opcionales comunes
        ...(data.nickname && { nickname: data.nickname }),
        ...(data.inbound_webhook_url && { inbound_webhook_url: data.inbound_webhook_url }),
      };

      // Campos específicos según el tipo de operación
      if (data.operation_type === 'create') {
        // Crear número nuevo
        requestData.area_code = data.area_code;
        if (data.phone_number) {
          requestData.phone_number = data.phone_number;
        }
        requestData.number_provider = data.number_provider || 'twilio';
        requestData.country_code = data.country_code || 'US';
        requestData.toll_free = data.toll_free || false;
      } else {
        // Importar número existente (según documentación Retell AI)
        requestData.phone_number = data.phone_number;
        requestData.termination_uri = data.termination_uri;
        if (data.sip_trunk_auth_username) {
          requestData.sip_trunk_auth_username = data.sip_trunk_auth_username;
        }
        if (data.sip_trunk_auth_password) {
          requestData.sip_trunk_auth_password = data.sip_trunk_auth_password;
        }
      }

      // Llamada al endpoint del backend
      const response = await fetch('/api/phone-numbers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('Phone number created successfully:', result.data);
      
      onSuccess?.(result.data);
      reset();
      onClose();
    } catch (err) {
      console.error('Error creating phone number:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el número de teléfono');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 0) {
      return `+${cleaned}`;
    }
    return value;
  };

  if (!isOpen) return null;

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
              <h2 className="text-xl font-semibold text-gray-900">
                {watchedOperationType === 'import' ? 'Importar Número de Teléfono' : 'Crear Número de Teléfono'}
              </h2>
              <p className="text-sm text-gray-500">
                {watchedOperationType === 'import' 
                  ? 'Importa un número existente desde tu proveedor SIP'
                  : 'Compra y configura un nuevo número para tus agentes'}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Operación *
              </label>
              <select
                {...register('operation_type')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="import">Importar Número Existente</option>
                <option value="create">Crear Número Nuevo</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {watchedOperationType === 'import' 
                  ? 'Importa un número de teléfono existente desde tu proveedor SIP'
                  : 'Compra un nuevo número de teléfono desde Retell'}
              </p>
            </div>

            {/* Campos para Importar */}
            {watchedOperationType === 'import' && (
              <>
                {/* Phone Number (Required for import) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Teléfono (E.164) *
                  </label>
                  <input
                    {...register('phone_number')}
                    type="tel"
                    placeholder="+14157774444"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setValue('phone_number', formatted);
                    }}
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Número en formato E.164 (ej: +14157774444)
                  </p>
                </div>

                {/* Termination URI (Required for import) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Termination URI *
                  </label>
                  <input
                    {...register('termination_uri')}
                    type="text"
                    placeholder="someuri.pstn.twilio.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  {errors.termination_uri && (
                    <p className="mt-1 text-sm text-red-600">{errors.termination_uri.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    URI de terminación SIP. Para Twilio siempre termina con ".pstn.twilio.com"
                  </p>
                </div>

                {/* SIP Trunk Auth Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIP Trunk Auth Username (opcional)
                  </label>
                  <input
                    {...register('sip_trunk_auth_username')}
                    type="text"
                    placeholder="username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Usuario para autenticación del SIP trunk
                  </p>
                </div>

                {/* SIP Trunk Auth Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIP Trunk Auth Password (opcional)
                  </label>
                  <input
                    {...register('sip_trunk_auth_password')}
                    type="password"
                    placeholder="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Contraseña para autenticación del SIP trunk
                  </p>
                </div>
              </>
            )}

            {/* Campos para Crear */}
            {watchedOperationType === 'create' && (
              <>
                {/* Area Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Área *
                  </label>
                  <input
                    {...register('area_code', { valueAsNumber: true })}
                    type="number"
                    placeholder="415"
                    min="100"
                    max="999"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  {errors.area_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.area_code.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Código de área de 3 dígitos para obtener un número (solo US actualmente)
                  </p>
                </div>

                {/* Phone Number (Optional - for specific number) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Específico (opcional)
                  </label>
                  <input
                    {...register('phone_number')}
                    type="tel"
                    placeholder="+14157774444"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setValue('phone_number', formatted);
                    }}
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Deja vacío para obtener un número aleatorio del código de área
                  </p>
                </div>
              </>
            )}

            {/* Provider and Country - Solo para crear */}
            {watchedOperationType === 'create' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor
                    </label>
                    <select
                      {...register('number_provider')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="twilio">Twilio</option>
                      <option value="telnyx">Telnyx</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <select
                      {...register('country_code')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="US">Estados Unidos</option>
                      <option value="CA">Canadá</option>
                    </select>
                  </div>
                </div>

                {/* Toll Free */}
                <div className="flex items-center space-x-3">
                  <input
                    {...register('toll_free')}
                    type="checkbox"
                    id="toll_free"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="toll_free" className="text-sm font-medium text-gray-700">
                    Número gratuito (toll-free)
                  </label>
                  <span className="text-xs text-gray-500">(costos más altos)</span>
                </div>
              </>
            )}

            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname (optional)
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
              <h3 className="text-sm font-medium text-gray-900">Agent Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inbound Agent
                  </label>
                  <select
                    {...register('inbound_agent_id')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select agent...</option>
                    {agents.map((agent, index) => (
                      <option key={`inbound-${agent.agent_id}-${index}`} value={agent.agent_id}>
                        {agent.agent_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outbound Agent
                  </label>
                  <select
                    {...register('outbound_agent_id')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select agent...</option>
                    {agents.map((agent, index) => (
                      <option key={`outbound-${agent.agent_id}-${index}`} value={agent.agent_id}>
                        {agent.agent_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Inbound Webhook */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inbound Webhook URL (optional)
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
                {watchedOperationType === 'import' ? 'Importando número...' : 'Creando número...'}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {watchedOperationType === 'import' ? 'Importar Número' : 'Crear Número de Teléfono'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
