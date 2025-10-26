'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Phone, Plus, AlertCircle } from 'lucide-react';

const phoneNumberSchema = z.object({
  phone_number: z.string()
    .min(1, 'Número de teléfono es requerido')
    .regex(/^\+[1-9]\d{1,14}$/, 'Debe estar en formato E.164 (ej: +14157774444)'),
  termination_uri: z.string()
    .min(1, 'Termination URI es requerido')
    .refine((uri) => uri.includes('.'), 'Debe ser una URI válida'),
  sip_trunk_auth_username: z.string().optional(),
  sip_trunk_auth_password: z.string().optional(),
  inbound_agent_id: z.string().optional(),
  outbound_agent_id: z.string().optional(),
  inbound_agent_version: z.number().min(1).optional(),
  outbound_agent_version: z.number().min(1).optional(),
  nickname: z.string().optional(),
  inbound_webhook_url: z.string().url().optional().or(z.literal('')),
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
      inbound_agent_version: 1,
      outbound_agent_version: 1,
      nickname: '',
    },
  });

  const watchedPhoneNumber = watch('phone_number');

  const onSubmit = async (data: PhoneNumberFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implementar la llamada a la API
      // const result = await fetch('/api/phone-numbers', { method: 'POST', body: data });
      console.log('Importing phone number:', data);
      onSuccess?.(data);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar el número');
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
              <h2 className="text-xl font-semibold text-gray-900">Import Phone Number</h2>
              <p className="text-sm text-gray-500">Configure a custom number for your agents</p>
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
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (E.164) *
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
            </div>

            {/* Termination URI */}
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
            </div>

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

            {/* SIP Auth */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">SIP Authentication (optional)</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIP Username
                </label>
                <input
                  {...register('sip_trunk_auth_username')}
                  type="text"
                  placeholder="username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIP Password
                </label>
                <input
                  {...register('sip_trunk_auth_password')}
                  type="password"
                  placeholder="123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
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
                    {agents.map((agent) => (
                      <option key={agent.agent_id} value={agent.agent_id}>
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
                    {agents.map((agent) => (
                      <option key={agent.agent_id} value={agent.agent_id}>
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
                Importing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Import Phone Number
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
