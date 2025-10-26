/**
 * Componente para mostrar la lista de voces disponibles
 * Con filtros y búsqueda
 */

import { RetellVoice } from '@/lib/retell';
import { VoiceCard } from './VoiceCard';
import { Search, Filter, Grid, List } from 'lucide-react';
import { useState, useMemo } from 'react';

interface VoiceListProps {
  voices: RetellVoice[];
  selectedVoice?: RetellVoice;
  onVoiceSelect?: (voice: RetellVoice) => void;
  onVoicePreview?: (voice: RetellVoice) => void;
}

export function VoiceList({ voices, selectedVoice, onVoiceSelect, onVoicePreview }: VoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Obtener proveedores únicos
  const providers = useMemo(() => {
    const uniqueProviders = [...new Set(voices.map(v => v.provider))];
    return uniqueProviders;
  }, [voices]);

  // Filtrar voces
  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      const matchesSearch = voice.voice_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           voice.accent?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProvider = selectedProvider === 'all' || voice.provider === selectedProvider;
      const matchesGender = selectedGender === 'all' || voice.gender === selectedGender;

      return matchesSearch && matchesProvider && matchesGender;
    });
  }, [voices, searchTerm, selectedProvider, selectedGender]);

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voces Disponibles</h2>
          <p className="text-gray-600">
            {filteredVoices.length} de {voices.length} voces
          </p>
        </div>

        {/* Controles de vista */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre o acento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtro por proveedor */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los proveedores</option>
            {providers.map(provider => (
              <option key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por género */}
        <select
          value={selectedGender}
          onChange={(e) => setSelectedGender(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los géneros</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
        </select>
      </div>

      {/* Lista de voces */}
      {filteredVoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron voces</h3>
          <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredVoices.map((voice) => (
            <VoiceCard
              key={voice.voice_id}
              voice={voice}
              isSelected={selectedVoice?.voice_id === voice.voice_id}
              onSelect={onVoiceSelect}
              onPreview={onVoicePreview}
            />
          ))}
        </div>
      )}

      {/* Información de la voz seleccionada */}
      {selectedVoice && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Voz Seleccionada</h3>
          <div className="flex items-center space-x-4 text-sm text-blue-800">
            <span className="font-medium">{selectedVoice.voice_name}</span>
            <span className="px-2 py-1 bg-blue-100 rounded text-xs">
              {selectedVoice.provider}
            </span>
            <span className="capitalize">{selectedVoice.gender}</span>
            {selectedVoice.accent && (
              <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                {selectedVoice.accent}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
