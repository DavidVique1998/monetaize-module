/**
 * Página de configuración de voces
 * Muestra todas las voces disponibles de Retell AI
 */

'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { VoiceList } from '@/components/voices/VoiceList';
import { useVoices } from '@/hooks/useVoices';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, Volume2 } from 'lucide-react';

export default function VoicesPage() {
  const {
    voices,
    selectedVoice,
    loading,
    error,
    loadVoices,
    selectVoice,
    previewVoice,
    getVoiceStats,
  } = useVoices();

  const stats = getVoiceStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Cargando voces disponibles...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Volume2 className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar las voces
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadVoices} className="bg-primary hover:bg-primary/90">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración de Voces</h1>
            <p className="text-gray-600 mt-2">
              Selecciona y configura las voces para tus agentes de llamada
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={loadVoices}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Settings className="w-4 h-4 mr-2" />
              <span>Configuración</span>
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Volume2 className="w-8 h-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total de Voces</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">11</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">ElevenLabs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.byProvider.elevenlabs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">AI</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">OpenAI</p>
                <p className="text-2xl font-bold text-gray-900">{stats.byProvider.openai || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-sm">DG</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Deepgram</p>
                <p className="text-2xl font-bold text-gray-900">{stats.byProvider.deepgram || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de voces */}
        <div className="bg-card rounded-lg border border-gray-200 p-6">
          <VoiceList
            voices={voices}
            selectedVoice={selectedVoice}
            onVoiceSelect={selectVoice}
            onVoicePreview={previewVoice}
          />
        </div>

        {/* Información adicional */}
        {selectedVoice && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Información de la Voz Seleccionada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-blue-800">ID de Voz</p>
                <p className="text-sm text-blue-700 font-mono">{selectedVoice.voice_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Proveedor</p>
                <p className="text-sm text-blue-700 capitalize">{selectedVoice.provider}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Género</p>
                <p className="text-sm text-blue-700 capitalize">{selectedVoice.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Acento</p>
                <p className="text-sm text-blue-700">{selectedVoice.accent || 'No especificado'}</p>
              </div>
              {selectedVoice.age && (
                <div>
                  <p className="text-sm font-medium text-blue-800">Edad</p>
                  <p className="text-sm text-blue-700">{selectedVoice.age}</p>
                </div>
              )}
              {selectedVoice.preview_audio_url && (
                <div>
                  <p className="text-sm font-medium text-blue-800">Preview de Audio</p>
                  <a
                    href={selectedVoice.preview_audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-blue-800 underline"
                  >
                    Escuchar preview
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
