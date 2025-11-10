'use client';

import React, { useState, useEffect } from 'react';
import type { GHLLocation } from '@/lib/ghlApp';
import { Building2, MapPin, Phone, Mail, Globe, RefreshCw, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';

export function LocationsList() {
  const [locations, setLocations] = useState<GHLLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/locations');
      const result = await response.json();
      
      if (result.success) {
        setLocations(result.data || []);
      } else {
        setError(result.error || 'Error al cargar las locations');
      }
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Error al cargar las locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  // Filtrar locations por búsqueda
  const filteredLocations = locations.filter((location) => {
    const query = searchQuery.toLowerCase();
    return (
      location.name?.toLowerCase().includes(query) ||
      location.city?.toLowerCase().includes(query) ||
      location.state?.toLowerCase().includes(query) ||
      location.address1?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={loadLocations}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          />
        </div>
        <button
          onClick={loadLocations}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Mostrando</p>
              <p className="text-2xl font-bold text-gray-900">{filteredLocations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de locations */}
      {filteredLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No se encontraron locations' : 'No hay locations disponibles'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <Link
              key={location.id}
              href={`/installer/${location.id}`}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name || 'Sin nombre'}</h3>
                    {location.city && location.state && (
                      <p className="text-sm text-gray-600">{location.city}, {location.state}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="space-y-2">
                {location.address1 && (
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span className="flex-1">{location.address1}</span>
                  </div>
                )}
                {location.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{location.phone}</span>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{location.email}</span>
                  </div>
                )}
                {location.website && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{location.website}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">ID: {location.id}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

