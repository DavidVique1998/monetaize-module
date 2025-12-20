'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ImportedPhoneNumber } from '@/lib/retell';

const makeCallSchema = z.object({
  agent_id: z.string().min(1, 'Debes seleccionar un agente'),
  to_number: z.string().regex(/^\+[1-9]\d{1,14}$/, 'El número debe estar en formato E.164 (ej: +1234567890)'),
  agent_version: z.string().optional(),
  retell_llm_dynamic_variables: z.string().optional(),
  metadata: z.string().optional(),
});

type MakeCallFormData = z.infer<typeof makeCallSchema>;

interface MakeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (callData: any) => void;
  phoneNumber: ImportedPhoneNumber | null;
  agents?: Array<{ agent_id: string; agent_name: string }>;
}

export function MakeCallModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  phoneNumber,
  agents = [] 
}: MakeCallModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<MakeCallFormData>({
    resolver: zodResolver(makeCallSchema),
    defaultValues: {
      agent_id: '',
      to_number: '',
      agent_version: '',
      retell_llm_dynamic_variables: '',
      metadata: '',
    },
  });

  const formatPhoneNumber = (value: string) => {
    // Formatear automáticamente mientras el usuario escribe
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 0) {
      return `+${cleaned}`;
    }
    return value;
  };

  const onSubmit = async (data: MakeCallFormData) => {
    if (!phoneNumber?.phone_number) {
      setError('Número de teléfono no válido');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Parsear JSON strings opcionales
      let retellLlmDynamicVariables: any = undefined;
      if (data.retell_llm_dynamic_variables && data.retell_llm_dynamic_variables.trim() !== '') {
        try {
          retellLlmDynamicVariables = JSON.parse(data.retell_llm_dynamic_variables);
        } catch {
          throw new Error('Las variables dinámicas deben ser un JSON válido');
        }
      }

      let metadata: any = undefined;
      if (data.metadata && data.metadata.trim() !== '') {
        try {
          metadata = JSON.parse(data.metadata);
        } catch {
          throw new Error('Los metadatos deben ser un JSON válido');
        }
      }

      const requestData: any = {
        agentId: data.agent_id,
        toNumber: data.to_number,
        fromNumber: phoneNumber.phone_number,
      };

      // Agregar campos opcionales solo si tienen valor
      if (data.agent_version && data.agent_version.trim() !== '') {
        const version = parseInt(data.agent_version, 10);
        if (!isNaN(version) && version > 0) {
          requestData.agentVersion = version;
        }
      }
      if (retellLlmDynamicVariables) {
        requestData.retellLlmDynamicVariables = retellLlmDynamicVariables;
      }
      if (metadata) {
        requestData.metadata = metadata;
      }

      const response = await fetch('/api/calls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Mostrar el error sin lanzar excepción
        setError(result.error || 'Error al crear la llamada');
        setIsLoading(false);
        return;
      }

      setCallId(result.data.call_id);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(result.data);
      }

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error making call:', err);
      // Solo capturar errores de red u otros errores inesperados
      setError(err.message || 'Error al crear la llamada. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    setSuccess(false);
    setCallId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Realizar Llamada Telefónica
          </DialogTitle>
          <DialogDescription>
            Realiza una llamada desde <strong>{phoneNumber?.phone_number_pretty || phoneNumber?.phone_number}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Agente */}
          <div className="space-y-2">
            <Label htmlFor="agent_id">
              Agente <span className="text-destructive">*</span>
            </Label>
            <select
              id="agent_id"
              {...register('agent_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background"
              disabled={isLoading}
            >
              <option value="">Seleccionar agente...</option>
              {agents.map((agent) => (
                <option key={agent.agent_id} value={agent.agent_id}>
                  {agent.agent_name || agent.agent_id.substring(0, 12)}
                </option>
              ))}
            </select>
            {errors.agent_id && (
              <p className="text-sm text-destructive">{errors.agent_id.message}</p>
            )}
          </div>

          {/* Número de destino */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Número de Destino (E.164) <span className="text-destructive">*</span>
            </label>
            <input
              {...register('to_number')}
              type="tel"
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setValue('to_number', formatted);
              }}
            />
            {errors.to_number && (
              <p className="mt-1 text-sm text-destructive">{errors.to_number.message}</p>
            )}
          </div>

          {/* Versión del agente (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="agent_version">
              Versión del Agente (opcional)
            </Label>
            <input
              id="agent_version"
              type="number"
              min="1"
              placeholder="1"
              {...register('agent_version')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.agent_version && (
              <p className="text-sm text-destructive">{errors.agent_version.message as string}</p>
            )}
          </div>

          {/* Variables dinámicas (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="retell_llm_dynamic_variables">
              Variables Dinámicas del LLM (opcional)
            </Label>
            <Textarea
              id="retell_llm_dynamic_variables"
              placeholder='{"customer_name": "John Doe", "order_id": "12345"}'
              rows={3}
              {...register('retell_llm_dynamic_variables')}
              disabled={isLoading}
            />
            {errors.retell_llm_dynamic_variables && (
              <p className="text-sm text-destructive">{errors.retell_llm_dynamic_variables.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JSON con variables que se inyectarán en el prompt del agente
            </p>
          </div>

          {/* Metadatos (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="metadata">
              Metadatos (opcional)
            </Label>
            <Textarea
              id="metadata"
              placeholder='{"campaign": "sales-outreach", "customerId": "cust_456"}'
              rows={3}
              {...register('metadata')}
              disabled={isLoading}
            />
            {errors.metadata && (
              <p className="text-sm text-destructive">{errors.metadata.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JSON con metadatos adicionales para la llamada
            </p>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="p-4 rounded-md flex items-start space-x-3 error-message-container">
              <AlertCircle className="w-5 h-5 flex-shrink-0 error-icon" />
              <div className="flex-1">
                <p className="font-semibold mb-1 error-title">Error</p>
                <p className="text-sm leading-relaxed error-text">{error}</p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && callId && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-700">Llamada creada exitosamente</p>
                <p className="text-xs text-emerald-600 mt-1">Call ID: {callId}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || agents.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando llamada...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Realizar Llamada
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
