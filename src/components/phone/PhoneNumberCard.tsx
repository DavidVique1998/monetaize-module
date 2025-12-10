/**
 * Componente para mostrar una tarjeta de número de teléfono
 */

import { ImportedPhoneNumber } from '@/lib/retell';
import { Phone, Settings, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PhoneNumberCardProps {
  phoneNumber: ImportedPhoneNumber;
  onEdit?: (phoneNumber: ImportedPhoneNumber) => void;
  onDelete?: (phoneNumber: string) => void;
  onTest?: (phoneNumber: string) => void;
}

export function PhoneNumberCard({ phoneNumber, onEdit, onDelete, onTest }: PhoneNumberCardProps) {
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'retell-twilio':
        return 'bg-destructive/10 text-destructive';
      case 'retell-telnyx':
        return 'bg-primary/10 text-primary';
      case 'custom':
        return 'bg-green-500/10 text-green-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'retell-twilio':
        return '📞';
      case 'retell-telnyx':
        return '🌐';
      case 'custom':
        return '⚙️';
      default:
        return '📱';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {phoneNumber.phone_number_pretty || phoneNumber.phone_number}
            </h3>
            <p className="text-sm text-muted-foreground">
              {phoneNumber.nickname || 'Sin nombre'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(phoneNumber.phone_number_type)}`}>
            {getTypeIcon(phoneNumber.phone_number_type)} {phoneNumber.phone_number_type}
          </span>
        </div>
      </div>

      {/* Información del número */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Número E.164</p>
            <p className="font-mono text-foreground">{phoneNumber.phone_number}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Código de área</p>
            <p className="text-foreground">{phoneNumber.area_code || 'N/A'}</p>
          </div>
        </div>

        {/* Agentes asignados */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {phoneNumber.inbound_agent_id ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">Agente entrante:</span>
            <span className="text-sm font-medium text-foreground">
              {phoneNumber.inbound_agent_id ? 'Configurado' : 'No configurado'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {phoneNumber.outbound_agent_id ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">Agente saliente:</span>
            <span className="text-sm font-medium text-foreground">
              {phoneNumber.outbound_agent_id ? 'Configurado' : 'No configurado'}
            </span>
          </div>
        </div>

        {/* Webhook */}
        {phoneNumber.inbound_webhook_url && (
          <div className="mt-3 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Webhook entrante:</p>
            <p className="text-sm font-mono text-foreground break-all">
              {phoneNumber.inbound_webhook_url}
            </p>
          </div>
        )}

        {/* Versiones de agentes */}
        {(phoneNumber.inbound_agent_version || phoneNumber.outbound_agent_version) && (
          <div className="flex space-x-4 text-sm">
            {phoneNumber.inbound_agent_version && (
              <div>
                <span className="text-muted-foreground">Versión entrante:</span>
                <span className="ml-1 font-medium text-foreground">{phoneNumber.inbound_agent_version}</span>
              </div>
            )}
            {phoneNumber.outbound_agent_version && (
              <div>
                <span className="text-muted-foreground">Versión saliente:</span>
                <span className="ml-1 font-medium text-foreground">{phoneNumber.outbound_agent_version}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground mb-4">
        Última modificación: {formatDate(new Date(phoneNumber.last_modification_timestamp))}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTest?.(phoneNumber.phone_number)}
            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
          >
            Probar
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit?.(phoneNumber)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(phoneNumber.phone_number)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
