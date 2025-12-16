'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { KnowledgeBase } from '@/types/knowledge-base';
import { Plus, BookOpen, Trash2, Edit2, ExternalLink, FileText, Globe } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { CreateKnowledgeBaseModal } from '@/components/knowledge/CreateKnowledgeBaseModal';
import { AddSourcesModal } from '@/components/knowledge/AddSourcesModal';

export default function KnowledgePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSourcesModal, setShowAddSourcesModal] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const actionButtonClass =
    "inline-flex items-center justify-center h-8 px-4 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-semibold";
  const iconButtonClass =
    "inline-flex items-center justify-center h-9 w-9 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-semibold";

  const loadKnowledgeBases = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/knowledge-bases');
      const data = await response.json();
      
      if (data.success) {
        setKnowledgeBases(data.data || []);
      } else {
        console.error('Error loading knowledge bases:', data.error);
      }
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const handleDelete = async (knowledgeBaseId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta Knowledge Base?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await loadKnowledgeBases();
      } else {
        alert('Error al eliminar: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      alert('Error al eliminar Knowledge Base');
    }
  };

  const handleAddSources = (kb: KnowledgeBase) => {
    setSelectedKnowledgeBase(kb);
    setShowAddSourcesModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      complete: 'bg-emerald-600/20 text-emerald-400',
      in_progress: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };

    const statusLabels: Record<string, string> = {
      complete: 'Completo',
      in_progress: 'Procesando',
      error: 'Error',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        <HeaderBar
          title="Knowledge Bases"
          description="Gestiona tus bases de conocimiento para proporcionar contexto a tus agentes"
          actions={
            <button
              onClick={() => setShowCreateModal(true)}
              className={`${actionButtonClass} gap-2`}
            >
              <Plus className="w-5 h-5" />
              Nueva Knowledge Base
            </button>
          }
        />

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Lista de Knowledge Bases */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" className="text-foreground/70" />
            </div>
          ) : knowledgeBases.length === 0 ? (
            <div className="text-center py-12 -50 rounded-lg border border-gray-200">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay Knowledge Bases</h3>
              <p className="text-gray-600 mb-4">
                Crea tu primera Knowledge Base para proporcionar contexto a tus agentes
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className={`${actionButtonClass} inline-flex items-center gap-2`}
              >
                <Plus className="w-5 h-5" />
                Crear Knowledge Base
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg-grid-cols-3 gap-4">
              {knowledgeBases.map((kb) => (
                <div
                  key={kb.knowledge_base_id}
                  className="bg-card border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {kb.knowledge_base_name}
                      </h3>
                      {getStatusBadge(kb.status)}
                    </div>
                  </div>

                <div className="space-y-2 mb-4">
                  {kb.knowledge_base_sources && kb.knowledge_base_sources.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Fuentes:</span>{' '}
                      {kb.knowledge_base_sources.length}
                    </div>
                  )}
                  
                  {kb.enable_auto_refresh && (
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span>Auto-refresh habilitado</span>
                    </div>
                  )}

                  {kb.last_refreshed_timestamp && (
                    <div className="text-xs text-gray-500">
                      Última actualización:{' '}
                      {new Date(kb.last_refreshed_timestamp).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleAddSources(kb)}
                    className={`${actionButtonClass} flex-1 h-8 text-sm gap-2`}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Fuentes
                  </button>
                  <button
                    onClick={() => handleDelete(kb.knowledge_base_id)}
                    className={iconButtonClass}
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear Knowledge Base */}
      {showCreateModal && (
        <CreateKnowledgeBaseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadKnowledgeBases();
          }}
        />
      )}

      {/* Modal para agregar fuentes */}
      {showAddSourcesModal && selectedKnowledgeBase && (
        <AddSourcesModal
          isOpen={showAddSourcesModal}
          onClose={() => {
            setShowAddSourcesModal(false);
            setSelectedKnowledgeBase(null);
          }}
          onSuccess={() => {
            setShowAddSourcesModal(false);
            setSelectedKnowledgeBase(null);
            loadKnowledgeBases();
          }}
          knowledgeBase={selectedKnowledgeBase}
        />
      )}
    </DashboardLayout>
  );
}
