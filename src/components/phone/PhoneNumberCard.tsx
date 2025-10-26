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
        return 'bg-red-100 text-red-800';
      case 'retell-telnyx':
        return 'bg-blue-100 text-blue-800';
      case 'custom':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {phoneNumber.phone_number_pretty || phoneNumber.phone_number}
            </h3>
            <p className="text-sm text-gray-600">
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
            <p className="text-gray-600">Número E.164</p>
            <p className="font-mono text-gray-900">{phoneNumber.phone_number}</p>
          </div>
          <div>
            <p className="text-gray-600">Código de área</p>
            <p className="text-gray-900">{phoneNumber.area_code || 'N/A'}</p>
          </div>
        </div>

        {/* Agentes asignados */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {phoneNumber.inbound_agent_id ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">Agente entrante:</span>
            <span className="text-sm font-medium">
              {phoneNumber.inbound_agent_id ? 'Configurado' : 'No configurado'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {phoneNumber.outbound_agent_id ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">Agente saliente:</span>
            <span className="text-sm font-medium">
              {phoneNumber.outbound_agent_id ? 'Configurado' : 'No configurado'}
            </span>
          </div>
        </div>

        {/* Webhook */}
        {phoneNumber.inbound_webhook_url && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Webhook entrante:</p>
            <p className="text-sm font-mono text-gray-900 break-all">
              {phoneNumber.inbound_webhook_url}
            </p>
          </div>
        )}

        {/* Versiones de agentes */}
        {(phoneNumber.inbound_agent_version || phoneNumber.outbound_agent_version) && (
          <div className="flex space-x-4 text-sm">
            {phoneNumber.inbound_agent_version && (
              <div>
                <span className="text-gray-600">Versión entrante:</span>
                <span className="ml-1 font-medium">{phoneNumber.inbound_agent_version}</span>
              </div>
            )}
            {phoneNumber.outbound_agent_version && (
              <div>
                <span className="text-gray-600">Versión saliente:</span>
                <span className="ml-1 font-medium">{phoneNumber.outbound_agent_version}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="text-xs text-gray-500 mb-4">
        Última modificación: {formatDate(new Date(phoneNumber.last_modification_timestamp))}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTest?.(phoneNumber.phone_number)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Probar
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit?.(phoneNumber)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(phoneNumber.phone_number)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
