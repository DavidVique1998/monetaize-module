'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Link, RefreshCw, Info } from 'lucide-react';

interface DebugInfo {
  userId: string;
  userEmail: string;
  retellAgentsCount: number;
  localAgentsCount: number;
  retellAgents: Array<{
    agent_id: string;
    agent_name: string;
    is_published: boolean;
    version: number;
  }>;
  localAgents: Array<{
    id: string;
    name: string;
    retellAgentId: string;
    userId: string;
    isActive: boolean;
  }>;
  missingLinks: string[];
}

export function AgentDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState<string | null>(null);

  const loadDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/agents');
      const result = await response.json();
      
      if (result.success) {
        setDebugInfo(result.data);
      } else {
        setError(result.error || 'Failed to load debug info');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const linkAgent = async (agentId: string) => {
    setLinking(agentId);
    
    try {
      const response = await fetch('/api/debug/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'link_agent',
          agentId: agentId
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Recargar información de debug
        await loadDebugInfo();
      } else {
        setError(result.error || 'Failed to link agent');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLinking(null);
    }
  };

  const syncAllAgents = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/debug/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_all'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadDebugInfo();
      } else {
        setError(result.error || 'Failed to sync agents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  return (
    <div className="bg-card border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Agent Debug Panel</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadDebugInfo}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={syncAllAgents}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
          >
            Sync All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-destructive/90 text-sm">{error}</p>
          </div>
        </div>
      )}

      {debugInfo && (
        <div className="space-y-4">
          {/* User Info */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">User Information</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>User ID:</strong> {debugInfo.userId}</p>
              <p><strong>Email:</strong> {debugInfo.userEmail}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{debugInfo.retellAgentsCount}</div>
              <div className="text-sm text-primary">Retell Agents</div>
            </div>
            <div className="bg-emerald-600/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{debugInfo.localAgentsCount}</div>
              <div className="text-sm text-emerald-400">Linked Agents</div>
            </div>
          </div>

          {/* Missing Links */}
          {debugInfo.missingLinks.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-700 mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Unlinked Agents ({debugInfo.missingLinks.length})</span>
              </h4>
              <div className="space-y-2">
                {debugInfo.retellAgents
                  .filter(agent => debugInfo.missingLinks.includes(agent.agent_id))
                  .filter((agent, index, self) => 
                    index === self.findIndex(a => a.agent_id === agent.agent_id)
                  )
                  .map(agent => (
                    <div key={agent.agent_id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-yellow-200">
                      <div>
                        <p className="font-medium text-foreground">{agent.agent_name}</p>
                        <p className="text-sm text-muted-foreground">ID: {agent.agent_id}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            agent.is_published 
                              ? 'bg-emerald-600/20 text-emerald-400' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {agent.is_published ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-xs text-muted-foreground">v{agent.version}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => linkAgent(agent.agent_id)}
                        disabled={linking === agent.agent_id}
                        className="px-3 py-1.5 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700 rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-50"
                      >
                        <Link className="w-4 h-4" />
                        <span>{linking === agent.agent_id ? 'Linking...' : 'Link'}</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Linked Agents */}
          {debugInfo.localAgentsCount > 0 && (
            <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-4">
              <h4 className="font-medium text-emerald-400 mb-3 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Linked Agents ({debugInfo.localAgentsCount})</span>
              </h4>
              <div className="space-y-2">
                {debugInfo.localAgents.map(agent => {
                  const retellAgent = debugInfo.retellAgents.find(r => r.agent_id === agent.retellAgentId);
                  return (
                    <div key={agent.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-emerald-600/20">
                      <div>
                        <p className="font-medium text-foreground">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {agent.retellAgentId}</p>
                        {retellAgent && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              retellAgent.is_published 
                                ? 'bg-emerald-600/20 text-emerald-400' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {retellAgent.is_published ? 'Published' : 'Draft'}
                            </span>
                            <span className="text-xs text-muted-foreground">v{retellAgent.version}</span>
                          </div>
                        )}
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {debugInfo.missingLinks.length === 0 && debugInfo.localAgentsCount > 0 && (
            <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-medium">All agents are properly linked!</p>
              <p className="text-emerald-400 text-sm">You should be able to edit your agents without issues.</p>
            </div>
          )}
        </div>
      )}

      {loading && !debugInfo && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading debug information...</p>
        </div>
      )}
    </div>
  );
}
