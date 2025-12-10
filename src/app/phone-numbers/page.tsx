/**
 * Página de gestión de números de teléfono
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { ImportPhoneNumberModal } from '@/components/phone/ImportPhoneNumberModal';
import { EditPhoneNumberModal } from '@/components/phone/EditPhoneNumberModal';
import { Button } from '@/components/ui/button';
import { usePhoneNumbers } from '@/hooks/usePhoneNumbers';
import { ImportedPhoneNumber } from '@/lib/retell';
import { Search, Plus, Phone, Edit, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

export default function PhoneNumbersPage() {
  const { phoneNumbers, loading, error, loadPhoneNumbers, importPhoneNumber } = usePhoneNumbers();
  const [agents, setAgents] = useState<Array<{ agent_id: string; agent_name: string }>>([]);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<ImportedPhoneNumber | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar agentes
  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const result = await response.json();
      if (result.success) {
        // Filtrar duplicados basándose en agent_id
        const uniqueAgents = result.data
          .map((agent: any) => ({
            agent_id: agent.agent_id,
            agent_name: agent.agent_name,
          }))
          .filter((agent: any, index: number, self: any[]) => 
            index === self.findIndex((a) => a.agent_id === agent.agent_id)
          );
        setAgents(uniqueAgents);
      }
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    loadAgents();
  }, []);

  // Manejar importación exitosa
  const handleImportSuccess = async (phoneNumberData: any) => {
    try {
      console.log('Phone number created successfully:', phoneNumberData);
      setShowImportForm(false);
      // Recargar la lista para mostrar el nuevo número
      await loadPhoneNumbers();
    } catch (err) {
      console.error('Error handling import success:', err);
      // Aún así recargar la lista por si el número se creó
      await loadPhoneNumbers();
    }
  };

  // Manejar eliminación
  const handleDelete = async (phoneNumber: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este número?')) return;
    
    try {
      // TODO: Implementar API endpoint para eliminar
      console.log('Delete phone number:', phoneNumber);
      loadPhoneNumbers(); // Recargar la lista
    } catch (err) {
      console.error('Error deleting phone number:', err);
    }
  };

  // Manejar edición
  const handleEdit = (phoneNumber: ImportedPhoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
    setShowEditForm(true);
  };

  // Manejar actualización exitosa
  const handleEditSuccess = async (phoneNumberData: any) => {
    try {
      console.log('Phone number updated successfully:', phoneNumberData);
      setShowEditForm(false);
      setSelectedPhoneNumber(null);
      // Recargar la lista para mostrar los cambios
      await loadPhoneNumbers();
    } catch (err) {
      console.error('Error handling edit success:', err);
      // Aún así recargar la lista por si el número se actualizó
      await loadPhoneNumbers();
    }
  };

  // Manejar prueba
  const handleTest = (phoneNumber: string) => {
    // TODO: Implementar prueba de llamada
    console.log('Test phone number:', phoneNumber);
  };

  // Filtrar números por búsqueda
  const filteredPhoneNumbers = phoneNumbers.filter((phone) => {
    const query = searchQuery.toLowerCase();
    return (
      phone.phone_number?.toLowerCase().includes(query) ||
      phone.phone_number_pretty?.toLowerCase().includes(query) ||
      phone.nickname?.toLowerCase().includes(query)
    );
  });

  if (loading && phoneNumbers.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Cargando números de teléfono...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <HeaderBar title="Numbers" />
        
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Top Bar with Search and Button */}
          <div className="flex items-center justify-between mb-6">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 h-10 w-96 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purplebg-background0 focus:border-transparent bg-card"
              />
            </div>

            {/* New Number Button */}
            <button
              onClick={() => setShowImportForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Number
            </button>
          </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-redbg-background border border-red-200 rounded-md flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-redbg-background0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Phone className="w-8 h-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Números</p>
                <p className="text-2xl font-bold text-gray-900">{phoneNumbers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">T</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Twilio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {phoneNumbers.filter(p => p.phone_number_type === 'retell-twilio').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-sm">T</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Telnyx</p>
                <p className="text-2xl font-bold text-gray-900">
                  {phoneNumbers.filter(p => p.phone_number_type === 'retell-telnyx').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">C</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Custom</p>
                <p className="text-2xl font-bold text-gray-900">
                  {phoneNumbers.filter(p => p.phone_number_type === 'custom').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-gray-200 shadow-sm">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-gray-700">
              <div>PHONE NUMBER</div>
              <div>NICKNAME</div>
              <div>TYPE</div>
              <div>INBOUND AGENT</div>
              <div>OUTBOUND AGENT</div>
              <div>ACTIONS</div>
            </div>
          </div>

          {/* Table Body */}
          {filteredPhoneNumbers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Phone className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-graybg-background0 font-medium">No phone numbers to display</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPhoneNumbers.map((phoneNumber) => (
                <div key={phoneNumber.phone_number} className="px-6 py-4 hover:bg-graybg-background transition-colors">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {phoneNumber.phone_number_pretty || phoneNumber.phone_number}
                      </p>
                      <p className="text-xs text-graybg-background0">{phoneNumber.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{phoneNumber.nickname || '-'}</p>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {phoneNumber.phone_number_type || 'custom'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{phoneNumber.inbound_agent_id?.substring(0, 12) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{phoneNumber.outbound_agent_id?.substring(0, 12) || '-'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(phoneNumber)}
                        className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(phoneNumber.phone_number || '')}
                        className="p-2 text-red-600 hover:bg-redbg-background rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Showing 1 - {filteredPhoneNumbers.length}</span>
            <span>{filteredPhoneNumbers.length} Results</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Page 1 of 1</span>
            <button disabled className="p-2 text-gray-400 cursor-not-allowed">←</button>
            <button disabled className="p-2 text-gray-400 cursor-not-allowed">→</button>
          </div>
        </div>

        {/* Modal de importación */}
        <ImportPhoneNumberModal
          isOpen={showImportForm}
          onClose={() => setShowImportForm(false)}
          onSuccess={handleImportSuccess}
          agents={agents}
        />

        {/* Modal de edición */}
        <EditPhoneNumberModal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedPhoneNumber(null);
          }}
          onSuccess={handleEditSuccess}
          phoneNumber={selectedPhoneNumber}
          agents={agents}
        />
        </div>
      </div>
    </DashboardLayout>
  );
}
