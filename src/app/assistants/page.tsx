'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { CreateAssistantModal } from '@/components/assistants/CreateAssistantModal';
import { useAgents, RetellAgent } from '@/hooks/useAgents';
import { Search, Bot, FolderPlus, MoreVertical, Trash2, Copy, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AssistantsPage() {
  const router = useRouter();
  const t = useTranslations('assistants');
  const { agents, loading, error, loadAgents } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneAgentId, setCloneAgentId] = useState<string | null>(null);
  const [cloneAgentName, setCloneAgentName] = useState('');
  const [cloning, setCloning] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  // Filter assistants and remove duplicates
  const filteredAgents = agents
    .filter((agent) => {
      const query = searchQuery.toLowerCase();
      return (
        agent.agent_name?.toLowerCase().includes(query) ||
        agent.agent_id?.toLowerCase().includes(query)
      );
    })
    .filter((agent, index, self) => 
      // Remove duplicates based on agent_id
      index === self.findIndex(a => a.agent_id === agent.agent_id)
    );

  const handleDelete = async (agentId: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadAgents();
      } else {
        const result = await response.json();
        alert(result.error || 'Error al eliminar el agente');
      }
    } catch (err) {
      console.error('Error deleting agent:', err);
      alert('Error al eliminar el agente');
    }
  };

  const handleClone = (agentId: string) => {
    setCloneAgentId(agentId);
    setCloneAgentName('');
    setShowCloneModal(true);
    setOpenMenuId(null);
  };

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneAgentId || !cloneAgentName.trim()) return;

    setCloning(true);
    try {
      const response = await fetch(`/api/agents/${cloneAgentId}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cloneAgentName.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCloneModal(false);
        setCloneAgentId(null);
        setCloneAgentName('');
        loadAgents();
      } else {
        alert(result.error || 'Error al clonar el agente');
      }
    } catch (err) {
      console.error('Error cloning agent:', err);
      alert('Error al clonar el agente');
    } finally {
      setCloning(false);
    }
  };

  const handleCreateAssistant = () => {
    setShowCreateModal(true);
  };

  const handleSelectAssistantOption = (option: string) => {
    console.log('Selected assistant option:', option);
    setShowCreateModal(false);
    // TODO: Implement navigation or form based on option selected
  };

  const handleCreateFolder = () => {
    // TODO: Implement create folder modal/form
    console.log('Create folder');
  };

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return 'N/A';
    // Retell API returns timestamps in milliseconds
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getModelName = (agent: RetellAgent) => {
    const responseEngine = agent.response_engine;
    
    // Check if it has llm_id property (for retell-llm and custom-llm types)
    if (responseEngine && 'llm_id' in responseEngine) {
      const llmId = responseEngine.llm_id;
      if (llmId?.includes('gpt-4')) return 'GPT-4o';
      if (llmId?.includes('gemini')) return 'Gemini 2.0 Flash';
      return llmId || 'Unknown';
    }
    
    // For conversation-flow type or other types
    if (responseEngine && 'type' in responseEngine) {
      return responseEngine.type || 'Unknown';
    }
    
    return 'Unknown';
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <HeaderBar title={t('title')} />
        
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Search and Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateFolder}
                className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                {t('createFolder')}
              </button>
              <button
                onClick={handleCreateAssistant}
                className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center cursor-pointer"
              >
                <Bot className="w-4 h-4 mr-2" />
                {t('createAssistant')}
              </button>
            </div>
          </div>


          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-gray-700">
                <div>{t('tableHeaders.name')}</div>
                <div>{t('tableHeaders.metaData')}</div>
                <div>{t('tableHeaders.updated')}</div>
                <div>{t('tableHeaders.created')}</div>
                <div>{t('tableHeaders.status')}</div>
                <div>{t('tableHeaders.id')}</div>
              </div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('loading')}</p>
                </div>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Bot className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">{t('noAssistants')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredAgents.map((agent) => (
                  <div 
                    key={agent.agent_id} 
                    className="px-6 py-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/assistants/${agent.agent_id}`)}
                  >
                    <div className="grid grid-cols-6 gap-4 items-center">
                      {/* Name */}
                      <div className="flex items-center space-x-3">
                        <Bot className="w-5 h-5 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {agent.agent_name || t('unnamedAssistant')}
                        </p>
                      </div>
                      
                      {/* Meta Data */}
                      <div>
                        <p className="text-sm text-gray-600">
                          {getModelName(agent)}
                        </p>
                      </div>
                      
                      {/* Last Modified */}
                      <div>
                        <p className="text-sm text-gray-600">
                          {'last_modification_timestamp' in agent && agent.last_modification_timestamp 
                            ? formatDate(agent.last_modification_timestamp) 
                            : 'N/A'}
                        </p>
                      </div>
                      
                      {/* Created */}
                      <div>
                        <p className="text-sm text-gray-600">
                          {'last_modification_timestamp' in agent && agent.last_modification_timestamp 
                            ? formatDate(agent.last_modification_timestamp) 
                            : 'N/A'}
                        </p>
                      </div>
                      
                      {/* Status */}
                      <div>
                        <div className="flex items-center space-x-2">
                          {(agent as any).is_published ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-green-600 font-medium">{t('status.published')}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm text-yellow-600 font-medium">{t('status.draft')}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('version')}{(agent as any).version || 0}
                        </p>
                      </div>
                      
                      {/* ID and Actions */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate max-w-[120px]">
                          {agent.agent_id.substring(0, 12)}...
                        </p>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === agent.agent_id ? null : agent.agent_id);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                            
                            {openMenuId === agent.agent_id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                  }}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClone(agent.agent_id);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 cursor-pointer"
                                  >
                                    <Copy className="w-4 h-4" />
                                    <span>Copiar</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(agent.agent_id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
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
              <select className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer">
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
              <span>Showing 1 - {filteredAgents.length} {filteredAgents.length} Results</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Page 1 of 1</span>
              <button disabled className="p-2 text-gray-400 cursor-not-allowed">←</button>
              <button disabled className="p-2 text-gray-400 cursor-not-allowed">→</button>
            </div>
          </div>
        </div>

        {/* Create Assistant Modal */}
        <CreateAssistantModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSelectOption={handleSelectAssistantOption}
          onAgentCreated={loadAgents}
        />

        {/* Clone Agent Modal */}
        {showCloneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Copiar Agente</h2>
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setCloneAgentId(null);
                    setCloneAgentName('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCloneSubmit} className="p-6">
                <div className="mb-4">
                  <label htmlFor="clone-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del nuevo agente
                  </label>
                  <input
                    type="text"
                    id="clone-name"
                    value={cloneAgentName}
                    onChange={(e) => setCloneAgentName(e.target.value)}
                    placeholder="Ej: Mi Agente - Copia"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    El agente será clonado con todas sus configuraciones, pero con un nuevo nombre.
                  </p>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCloneModal(false);
                      setCloneAgentId(null);
                      setCloneAgentName('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cloning || !cloneAgentName.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer"
                  >
                    {cloning ? 'Copiando...' : 'Copiar Agente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
