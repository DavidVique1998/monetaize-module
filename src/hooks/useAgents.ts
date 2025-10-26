'use client';

import { useState, useEffect } from 'react';

export interface RetellAgent {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  prompt: string;
  response_engine: {
    type: string;
    llm_id?: string;
  };
  version: number;
  created_at: number;
  updated_at: number;
}

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
        setAgents(result.data);
      } else {
        setError(result.error || 'Failed to load agents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
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
        setAgents(prev => [result.data, ...prev]);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create agent');
      }
    } catch (err) {
      throw err;
    }
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
  };
}
