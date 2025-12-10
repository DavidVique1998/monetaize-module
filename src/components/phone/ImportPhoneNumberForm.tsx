/**
 * Formulario para importar números de teléfono
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImportPhoneNumberData, RetellService } from '@/lib/retell';
import { Button } from '@/components/ui/button';
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

interface ImportPhoneNumberFormProps {
  onSuccess?: (phoneNumber: any) => void;
  onCancel?: () => void;
  agents?: Array<{ agent_id: string; agent_name: string }>;
}

export function ImportPhoneNumberForm({ onSuccess, onCancel, agents = [] }: ImportPhoneNumberFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PhoneNumberFormData>({
    resolver: zodResolver(phoneNumberSchema),
    defaultValues: {
      inbound_agent_version: 1,
      outbound_agent_version: 1,
      nickname: 'Imported Number',
    },
  });

  const watchedPhoneNumber = watch('phone_number');

  const onSubmit = async (data: PhoneNumberFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validar datos
      const validationErrors = RetellService.validatePhoneNumberData(data as ImportPhoneNumberData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Importar número
      const result = await RetellService.importPhoneNumber(data as ImportPhoneNumberData);
      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar el número');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Formatear automáticamente mientras el usuario escribe
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 0) {
      return `+${cleaned}`;
    }
    return value;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Phone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Importar Número de Teléfono</h2>
          <p className="text-muted-foreground">Configura un número personalizado para tus agentes</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-destructive font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Número de Teléfono (E.164) *
            </label>
            <input
              {...register('phone_number')}
              type="tel"
              placeholder="+14157774444"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setValue('phone_number', formatted);
              }}
            />
            {errors.phone_number && (
              <p className="mt-1 text-sm text-destructive">{errors.phone_number.message}</p>
            )}
            {watchedPhoneNumber && (
              <p className="mt-1 text-sm text-gray-500">
                Formato: {RetellService.formatPhoneNumber(watchedPhoneNumber)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Termination URI *
            </label>
            <input
              {...register('termination_uri')}
              type="text"
              placeholder="someuri.pstn.twilio.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.termination_uri && (
              <p className="mt-1 text-sm text-destructive">{errors.termination_uri.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Nombre (opcional)
            </label>
            <input
              {...register('nickname')}
              type="text"
              placeholder="Frontdesk Number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Autenticación SIP */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Autenticación SIP (opcional)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Usuario SIP
              </label>
              <input
                {...register('sip_trunk_auth_username')}
                type="text"
                placeholder="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Contraseña SIP
              </label>
              <input
                {...register('sip_trunk_auth_password')}
                type="password"
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Configuración de agentes */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Configuración de Agentes</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Agente Entrante
              </label>
              <select
                {...register('inbound_agent_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar agente...</option>
                {agents.map((agent) => (
                  <option key={agent.agent_id} value={agent.agent_id}>
                    {agent.agent_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Agente Saliente
              </label>
              <select
                {...register('outbound_agent_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar agente...</option>
                {agents.map((agent) => (
                  <option key={agent.agent_id} value={agent.agent_id}>
                    {agent.agent_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Versión Agente Entrante
              </label>
              <input
                {...register('inbound_agent_version', { valueAsNumber: true })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Versión Agente Saliente
              </label>
              <input
                {...register('outbound_agent_version', { valueAsNumber: true })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Webhook */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Webhook (opcional)</h3>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              URL de Webhook Entrante
            </label>
            <input
              {...register('inbound_webhook_url')}
              type="url"
              placeholder="https://example.com/inbound-webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.inbound_webhook_url && (
              <p className="mt-1 text-sm text-destructive">{errors.inbound_webhook_url.message}</p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Importando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Importar Número
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
