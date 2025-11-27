'use client';

import { useState, useEffect } from 'react';
import { RetellAgent as RetellAgentType, RetellAgentWithPrompt } from '@/lib/retell';

// Re-export the type for backwards compatibility
export type RetellAgent = RetellAgentType;

// Helper function to create mock agents
const createMockAgent = (overrides: Partial<RetellAgent> = {}): RetellAgent => {
  return {
    agent_id: overrides.agent_id || 'mock-agent-12345',
    agent_name: overrides.agent_name || 'New Blank Assistant',
    voice_id: overrides.voice_id || '11labs-Emily',
    language: overrides.language || 'en-US',
    response_engine: {
      type: 'retell-llm',
      llm_id: ''
    },
    ...overrides
  } as RetellAgent;
};

const MOCK_AGENT = createMockAgent();

export function useAgents() {
  const [agents, setAgents] = useState<RetellAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agents');
      const result = await response.json();
      
      if (result.success) {
        // Remove duplicates based on agent_id
        const uniqueAgents = result.data.filter((agent: any, index: number, self: any[]) => 
          index === self.findIndex(a => a.agent_id === agent.agent_id)
        );
        setAgents(uniqueAgents);
      } else {
        console.warn('Failed to load agents from API, using mock data');
        // Use mock data as fallback
        setAgents([MOCK_AGENT]);
      }
    } catch (err) {
      console.warn('Error loading agents, using mock data:', err);
      // Use mock data as fallback
      setAgents([MOCK_AGENT]);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: any) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove any existing agent with the same ID before adding the new one
        setAgents(prev => {
          const filtered = prev.filter(agent => agent.agent_id !== result.data.agent_id);
          return [result.data, ...filtered];
        });
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create agent');
      }
    } catch (err) {
      throw err;
    }
  };

  const getAgent = async (agentId: string): Promise<RetellAgentWithPrompt> => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        console.warn('Failed to load agent from API, trying to find in cached list');
        // Buscar en la lista de agentes en caché
        const cachedAgent = agents.find(a => a.agent_id === agentId);
        if (cachedAgent) {
          return { ...cachedAgent, prompt: '' } as RetellAgentWithPrompt;
        }
        // Si no está en caché, crear mock con ID
        return createMockAgent({ agent_id: agentId });
      }
    } catch (err) {
      console.warn('Error loading agent, trying to find in cached list:', err);
      // Buscar en la lista de agentes en caché
      const cachedAgent = agents.find(a => a.agent_id === agentId);
      if (cachedAgent) {
        return { ...cachedAgent, prompt: '' } as RetellAgentWithPrompt;
      }
      // Si no está en caché, crear mock con ID
      return createMockAgent({ agent_id: agentId });
    }
  };

  const updateAgent = async (agentId: string, agentData: any) => {
    try {
      console.log('useAgents: Updating agent:', agentId);
      console.log('useAgents: Update data:', agentData);
      
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });
      
      console.log('useAgents: Update response status:', response.status);
      
      const result = await response.json();
      console.log('useAgents: Update result:', result);
      
      if (result.success) {
        // Update the agent in the list with the returned data
        setAgents(prev => prev.map(agent => 
          agent.agent_id === agentId ? result.data : agent
        ));
        console.log('useAgents: Agent updated in local state');
        return result.data;
      } else {
        // Proporcionar información más útil para errores de ownership
        if (response.status === 404 && result.error?.includes('does not belong to your account')) {
          const enhancedError = new Error(
            `${result.error}\n\nSolución sugerida: Ve a /debug/agents para vincular este agente con tu cuenta.`
          );
          (enhancedError as any).isOwnershipError = true;
          (enhancedError as any).agentId = agentId;
          (enhancedError as any).debugUrl = '/debug/agents';
          throw enhancedError;
        }
        throw new Error(result.error || 'Failed to update agent');
      }
    } catch (err: any) {
      console.error('useAgents: Error updating agent:', err);
      throw err;
    }
  };

  const updateAgentStatus = (agentId: string, updates: Partial<any>) => {
    console.log('useAgents: Updating agent status:', agentId, updates);
    setAgents(prev => prev.map(agent => 
      agent.agent_id === agentId ? { ...agent, ...updates } : agent
    ));
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return {
    agents,
    loading,
    error,
    loadAgents,
    createAgent,
    getAgent,
    updateAgent,
    updateAgentStatus,
  };
}
