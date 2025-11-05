'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { CreateAssistantModal } from '@/components/assistants/CreateAssistantModal';
import { useAgents, RetellAgent } from '@/hooks/useAgents';
import { Search, Bot, FolderPlus, MoreVertical, Trash2, Star, Archive } from 'lucide-react';

type FilterTab = 'all' | 'favorites' | 'imported' | 'archived';

export default function AssistantsPage() {
  const router = useRouter();
  const { agents, loading, error, loadAgents } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  // Filter assistants and remove duplicates
  const filteredAgents = agents
    .filter((agent) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        agent.agent_name?.toLowerCase().includes(query) ||
        agent.agent_id?.toLowerCase().includes(query);
      
      // TODO: Implement proper filtering for favorites, imported, archived
      switch (activeTab) {
        case 'favorites':
          return matchesSearch; // Placeholder
        case 'imported':
          return matchesSearch; // Placeholder
        case 'archived':
          return matchesSearch; // Placeholder
        default:
          return matchesSearch;
      }
    })
    .filter((agent, index, self) => 
      // Remove duplicates based on agent_id
      index === self.findIndex(a => a.agent_id === agent.agent_id)
    );

  const handleDelete = async (agentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este asistente?')) return;
    
    try {
      // TODO: Implement API endpoint for deletion
      console.log('Delete agent:', agentId);
      loadAgents();
    } catch (err) {
      console.error('Error deleting agent:', err);
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
        <HeaderBar title="Assistants" />
        
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Search and Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for an assistant..."
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
                Create Folder
              </button>
              <button
                onClick={handleCreateAssistant}
                className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center cursor-pointer"
              >
                <Bot className="w-4 h-4 mr-2" />
                Create Assistant
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({agents.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'favorites'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Favorites (0)
            </button>
            <button
              onClick={() => setActiveTab('imported')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'imported'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Imported (0)
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'archived'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Archived (0)
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-gray-700">
                <div>NAME</div>
                <div>META DATA</div>
                <div>UPDATED</div>
                <div>CREATED</div>
                <div>STATUS</div>
                <div>ID</div>
              </div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading assistants...</p>
                </div>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Bot className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No assistants to display</p>
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
                          {agent.agent_name || 'Unnamed Assistant'}
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
                              <span className="text-sm text-green-600 font-medium">Published</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm text-yellow-600 font-medium">Draft</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          v{(agent as any).version || 0}
                        </p>
                      </div>
                      
                      {/* ID and Actions */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate max-w-[120px]">
                          {agent.agent_id.substring(0, 12)}...
                        </p>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(agent.agent_id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
      </div>
    </DashboardLayout>
  );
}
