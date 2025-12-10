'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { useAgents, RetellAgent } from '@/hooks/useAgents';
import { createBlankAssistant } from '@/app/actions/assistants';
import { Search, Bot, FolderPlus, MoreVertical, Trash2, Copy, X, Folder, ChevronRight, ChevronDown, Edit2, Move } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Folder {
  id: string;
  name: string;
  agentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AgentWithFolder extends RetellAgent {
  folderId?: string | null;
  folder?: { id: string; name: string } | null;
}

export default function AssistantsPage() {
  const router = useRouter();
  const t = useTranslations('assistants');
  const { agents, loading, error, loadAgents } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneAgentId, setCloneAgentId] = useState<string | null>(null);
  const [cloneAgentName, setCloneAgentName] = useState('');
  const [cloning, setCloning] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Folder state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [selectedFolderForMove, setSelectedFolderForMove] = useState<string | null>(null);
  const [agentToMove, setAgentToMove] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setFoldersLoading(true);
    try {
      const response = await fetch('/api/folders');
      const result = await response.json();
      if (result.success) {
        setFolders(result.data);
      }
    } catch (err) {
      console.error('Error loading folders:', err);
    } finally {
      setFoldersLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      const result = await response.json();
      if (result.success) {
        setShowCreateFolderModal(false);
        setNewFolderName('');
        loadFolders();
      } else {
        alert(result.error || 'Error al crear la carpeta');
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      alert('Error al crear la carpeta');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carpeta? Los agentes se moverán a "Sin carpeta".')) return;

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadFolders();
        loadAgents();
      } else {
        const result = await response.json();
        alert(result.error || 'Error al eliminar la carpeta');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      alert('Error al eliminar la carpeta');
    }
  };

  const handleMoveAgent = async (agentId: string, folderId: string | null) => {
    try {
      const response = await fetch('/api/agents/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, folderId }),
      });

      if (response.ok) {
        loadAgents();
        setSelectedFolderForMove(null);
        setAgentToMove(null);
      } else {
        const result = await response.json();
        alert(result.error || 'Error al mover el agente');
      }
    } catch (err) {
      console.error('Error moving agent:', err);
      alert('Error al mover el agente');
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Filter assistants and remove duplicates
  const filteredAgents = (agents as AgentWithFolder[])
    .filter((agent) => {
      const query = searchQuery.toLowerCase();
      return (
        agent.agent_name?.toLowerCase().includes(query) ||
        agent.agent_id?.toLowerCase().includes(query)
      );
    })
    .filter((agent, index, self) => 
      index === self.findIndex(a => a.agent_id === agent.agent_id)
    );

  // Organize agents by folder
  const agentsByFolder = filteredAgents.reduce((acc, agent) => {
    const folderId = agent.folderId || 'none';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(agent);
    return acc;
  }, {} as Record<string, AgentWithFolder[]>);

  const agentsWithoutFolder = agentsByFolder['none'] || [];

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloneAgentName.trim() }),
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

  const handleCreateAssistant = async () => {
    setCreatingAgent(true);
    try {
      const result = await createBlankAssistant();
      
      if (result.success && result.data?.agent_id) {
        // Recargar la lista de agentes
        await loadAgents();
        // Navegar a la página de edición del nuevo agente
        router.push(`/assistants/${result.data.agent_id}`);
      } else {
        alert(result.error || 'Error al crear el agente');
      }
    } catch (err) {
      console.error('Error creating assistant:', err);
      alert('Error al crear el agente');
    } finally {
      setCreatingAgent(false);
    }
  };

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return 'N/A';
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
    if (responseEngine && 'llm_id' in responseEngine) {
      const llmId = responseEngine.llm_id;
      if (llmId?.includes('gpt-4')) return 'GPT-4o';
      if (llmId?.includes('gemini')) return 'Gemini 2.0 Flash';
      return llmId || 'Unknown';
    }
    if (responseEngine && 'type' in responseEngine) {
      return responseEngine.type || 'Unknown';
    }
    return 'Unknown';
  };

  const renderAgentRow = (agent: AgentWithFolder) => (
    <div 
      key={agent.agent_id} 
      className="px-6 py-4 hover:bg-background transition-colors group cursor-pointer border-b border-gray-100"
      onClick={() => router.push(`/assistants/${agent.agent_id}`)}
    >
      <div className="grid grid-cols-6 gap-4 items-center">
        <div className="flex items-center space-x-3">
          <Bot className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground truncate">
            {agent.agent_name || t('unnamedAssistant')}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{getModelName(agent)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {'last_modification_timestamp' in agent && agent.last_modification_timestamp 
              ? formatDate(agent.last_modification_timestamp) 
              : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {'last_modification_timestamp' in agent && agent.last_modification_timestamp 
              ? formatDate(agent.last_modification_timestamp) 
              : 'N/A'}
          </p>
        </div>
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
                className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
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
                  <div className="absolute right-0 mt-1 w-48 bg-card rounded-lg shadow-lg border border-border z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAgentToMove(agent.agent_id);
                        setSelectedFolderForMove(agent.folderId || null);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-sm text-muted-foreground hover:bg-background flex items-center space-x-2 cursor-pointer"
                    >
                      <Move className="w-4 h-4" />
                      <span>Mover a carpeta</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClone(agent.agent_id);
                      }}
                      className="w-full px-4 py-2 text-sm text-muted-foreground hover:bg-background flex items-center space-x-2 cursor-pointer"
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
                      className="w-full px-4 py-2 text-sm text-destructive hover:bg-red-50 flex items-center space-x-2 cursor-pointer"
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
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        <HeaderBar title={t('title')} />
        
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg text-sm text-muted-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-card"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="bg-black hover:bg-gray-800 text-primary-foreground font-semibold px-6 py-2 rounded-lg transition-colors flex items-center cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                {t('createFolder')}
              </button>
              <button
                onClick={handleCreateAssistant}
                disabled={creatingAgent}
                className="bg-black hover:bg-gray-800 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold px-6 py-2 rounded-lg transition-colors flex items-center cursor-pointer"
              >
                {creatingAgent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    {t('createAssistant')}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="px-6 py-4 border-b border-border">
              <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-muted-foreground">
                <div>{t('tableHeaders.name')}</div>
                <div>{t('tableHeaders.metaData')}</div>
                <div>{t('tableHeaders.updated')}</div>
                <div>{t('tableHeaders.created')}</div>
                <div>{t('tableHeaders.status')}</div>
                <div>{t('tableHeaders.id')}</div>
              </div>
            </div>

            {loading || foldersLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">{t('loading')}</p>
                </div>
              </div>
            ) : filteredAgents.length === 0 && folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-gray-500 font-medium">{t('noAssistants')}</p>
              </div>
            ) : (
              <div>
                {/* Folders */}
                {folders.map((folder) => {
                  const folderAgents = agentsByFolder[folder.id] || [];
                  const isExpanded = expandedFolders.has(folder.id);
                  
                  return (
                    <div key={folder.id} className="border-b border-border">
                      <div 
                        className="px-6 py-3 bg-background hover:bg-muted transition-colors cursor-pointer flex items-center justify-between group"
                        onClick={() => toggleFolder(folder.id)}
                      >
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <Folder className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-foreground">{folder.name}</span>
                          <span className="text-xs text-gray-500">({folderAgents.length})</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                      {isExpanded && folderAgents.map(renderAgentRow)}
                    </div>
                  );
                })}

                {/* Agents without folder */}
                {agentsWithoutFolder.length > 0 && (
                  <div className="border-b border-border">
                    <div className="px-6 py-3 bg-background">
                      <span className="text-sm font-medium text-foreground">Sin carpeta</span>
                      <span className="text-xs text-gray-500 ml-2">({agentsWithoutFolder.length})</span>
                    </div>
                    {agentsWithoutFolder.map(renderAgentRow)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Folder Modal */}
        {showCreateFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Crear Carpeta</h2>
                <button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCreateFolder} className="p-6">
                <div className="mb-4">
                  <label htmlFor="folder-name" className="block text-sm font-medium text-muted-foreground mb-2">
                    Nombre de la carpeta
                  </label>
                  <input
                    type="text"
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ej: Ventas, Soporte, Marketing"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateFolderModal(false);
                      setNewFolderName('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFolder || !newFolderName.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-primary-foreground font-semibold rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer"
                  >
                    {creatingFolder ? 'Creando...' : 'Crear Carpeta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Move Agent Modal */}
        {agentToMove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Mover Agente</h2>
                <button
                  onClick={() => {
                    setAgentToMove(null);
                    setSelectedFolderForMove(null);
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Seleccionar carpeta
                  </label>
                  <select
                    value={selectedFolderForMove || ''}
                    onChange={(e) => setSelectedFolderForMove(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Sin carpeta</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAgentToMove(null);
                      setSelectedFolderForMove(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (agentToMove) {
                        handleMoveAgent(agentToMove, selectedFolderForMove);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-primary-foreground font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Mover
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCloneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Copiar Agente</h2>
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setCloneAgentId(null);
                    setCloneAgentName('');
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCloneSubmit} className="p-6">
                <div className="mb-4">
                  <label htmlFor="clone-name" className="block text-sm font-medium text-muted-foreground mb-2">
                    Nombre del nuevo agente
                  </label>
                  <input
                    type="text"
                    id="clone-name"
                    value={cloneAgentName}
                    onChange={(e) => setCloneAgentName(e.target.value)}
                    placeholder="Ej: Mi Agente - Copia"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCloneModal(false);
                      setCloneAgentId(null);
                      setCloneAgentName('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cloning || !cloneAgentName.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-primary-foreground font-semibold rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer"
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
