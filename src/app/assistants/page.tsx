'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { useAgents, RetellAgent } from '@/hooks/useAgents';
import { createBlankAssistant } from '@/app/actions/assistants';
import { Search, Bot, FolderPlus, MoreVertical, Trash2, Copy, X, Folder, ChevronRight, ChevronDown, Edit2, Move } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

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

export default function AssistantsPage(): React.ReactNode {
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
    <TableRow
      key={agent.agent_id}
      className="group cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => router.push(`/assistants/${agent.agent_id}`)}
    >
      <TableCell className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <Bot className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground truncate">
            {agent.agent_name || t('unnamedAssistant')}
          </p>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <p className="text-sm text-muted-foreground">{getModelName(agent)}</p>
      </TableCell>
      <TableCell className="px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {'last_modification_timestamp' in agent && agent.last_modification_timestamp 
            ? formatDate(agent.last_modification_timestamp) 
            : 'N/A'}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {'last_modification_timestamp' in agent && agent.last_modification_timestamp 
            ? formatDate(agent.last_modification_timestamp) 
            : 'N/A'}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center space-x-2">
          {(agent as any).is_published ? (
            <>
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              <span className="text-sm text-emerald-400 font-medium">{t('status.published')}</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-600 font-medium">{t('status.draft')}</span>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('version')}{(agent as any).version || 0}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center justify-end space-x-2">
          <p className="text-sm text-muted-foreground truncate max-w-[120px]">
            {agent.agent_id.substring(0, 12)}...
          </p>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === agent.agent_id ? null : agent.agent_id);
                }}
                className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-semibold"
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
                  <div className="absolute right-0 mt-1 w-48 bg-card rounded-lg shadow-lg border border-gray-200 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAgentToMove(agent.agent_id);
                        setSelectedFolderForMove(agent.folderId || null);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-sm font-semibold text-background bg-foreground hover:bg-foreground/90 flex items-center space-x-2 cursor-pointer"
                    >
                      <Move className="w-4 h-4" />
                      <span>Mover a carpeta</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClone(agent.agent_id);
                      }}
                      className="w-full px-4 py-2 text-sm font-semibold text-background bg-foreground hover:bg-foreground/90 flex items-center space-x-2 cursor-pointer"
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
                      className="w-full px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 flex items-center space-x-2 cursor-pointer"
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
      </TableCell>
    </TableRow>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        <HeaderBar 
          title={t('title')} 
          description={t('headerDescription')}
          actions={
            <div className="flex items-center space-x-3">
              <Button
                variant="default-outline"
                onClick={() => setShowCreateFolderModal(true)}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                {t('createFolder')}
              </Button>
              <Button
                onClick={handleCreateAssistant}
                disabled={creatingAgent}
              >
                {creatingAgent ? (
                  <>
                    <Spinner size="sm" className="mr-2 text-background" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    {t('createAssistant')}
                  </>
                )}
              </Button>
            </div>
          }
        />
        
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg text-sm text-muted-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-card"
              />
            </div>
          </div>
          <div className="bg-card rounded-lg border border-gray-200 shadow-sm">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('tableHeaders.name')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('tableHeaders.metaData')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('tableHeaders.updated')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('tableHeaders.created')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('tableHeaders.status')}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center">
                    {t('tableHeaders.id')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || foldersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16">
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <Spinner size="lg" className="mx-auto mb-4 text-primary" />
                          <p className="text-muted-foreground">{t('loading')}</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAgents.length === 0 && folders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Bot className="w-12 h-12 text-muted-foreground" />
                        <p className="text-muted-foreground font-medium">{t('noAssistants')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {folders.map((folder) => {
                      const folderAgents = agentsByFolder[folder.id] || [];
                      const isExpanded = expandedFolders.has(folder.id);
                      
                      return (
                        <Fragment key={folder.id}>
                          <TableRow 
                            className="bg-muted/30 hover:bg-muted/40 cursor-pointer transition-colors"
                            onClick={() => toggleFolder(folder.id)}
                          >
                            <TableCell colSpan={6} className="px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <Folder className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium text-foreground">{folder.name}</span>
                                  <span className="text-xs text-muted-foreground">({folderAgents.length})</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFolder(folder.id);
                                  }}
                                  className="p-1 hover:bg-destructive/10 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && folderAgents.map(renderAgentRow)}
                        </Fragment>
                      );
                    })}

                    {agentsWithoutFolder.length > 0 && (
                      <>
                        <TableRow className="bg-muted/30 hover:bg-muted/40 transition-colors">
                          <TableCell colSpan={6} className="px-4 py-3">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-foreground">Sin carpeta</span>
                              <span className="text-xs text-muted-foreground ml-2">({agentsWithoutFolder.length})</span>
                            </div>
                          </TableCell>
                        </TableRow>
                        {agentsWithoutFolder.map(renderAgentRow)}
                      </>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Create Folder Modal */}
        {showCreateFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
