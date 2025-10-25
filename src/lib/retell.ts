/**
 * Servicio para integración con Retell AI
 * Maneja la creación, configuración y gestión de agentes
 */

import Retell from 'retell-sdk';
import { config } from './config';
import { apiClient, handleApiResponse } from './axios';

// Inicializar cliente de Retell AI
export const retellClient = new Retell({
  apiKey: config.retell.apiKey,
});

// Tipos para Retell AI
export interface RetellAgent {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  response_engine: {
    type: 'retell-llm' | 'custom-llm';
    llm_id?: string;
  };
  prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentData {
  agent_name: string;
  voice_id: string;
  language: string;
  prompt: string;
  response_engine: {
    type: 'retell-llm' | 'custom-llm';
    llm_id?: string;
  };
  webhook_url?: string;
  webhook_events?: string[];
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  agent_id: string;
}

export interface RetellVoice {
  voice_id: string;
  name: string;
  provider: string;
  language: string;
  gender?: string;
  description?: string;
}

export interface CallData {
  agent_id: string;
  from_number: string;
  to_number: string;
  metadata?: Record<string, any>;
}

export interface CallResponse {
  call_id: string;
  status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Servicio principal de Retell AI
export class RetellService {
  /**
   * Crear un nuevo agente
   */
  static async createAgent(data: CreateAgentData): Promise<RetellAgent> {
    try {
      const agent = await retellClient.agent.create({
        agent_name: data.agent_name,
        voice_id: data.voice_id,
        language: data.language,
        prompt: data.prompt,
        response_engine: data.response_engine,
        webhook_url: data.webhook_url,
        webhook_events: data.webhook_events,
      });

      return agent as RetellAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new Error('Failed to create agent');
    }
  }

  /**
   * Obtener todos los agentes
   */
  static async getAgents(): Promise<RetellAgent[]> {
    try {
      const agents = await retellClient.agent.list();
      return agents as RetellAgent[];
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw new Error('Failed to fetch agents');
    }
  }

  /**
   * Obtener un agente específico
   */
  static async getAgent(agentId: string): Promise<RetellAgent> {
    try {
      const agent = await retellClient.agent.retrieve(agentId);
      return agent as RetellAgent;
    } catch (error) {
      console.error('Error fetching agent:', error);
      throw new Error('Failed to fetch agent');
    }
  }

  /**
   * Actualizar un agente
   */
  static async updateAgent(data: UpdateAgentData): Promise<RetellAgent> {
    try {
      const { agent_id, ...updateData } = data;
      const agent = await retellClient.agent.update(agent_id, updateData);
      return agent as RetellAgent;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw new Error('Failed to update agent');
    }
  }

  /**
   * Eliminar un agente
   */
  static async deleteAgent(agentId: string): Promise<void> {
    try {
      await retellClient.agent.delete(agentId);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw new Error('Failed to delete agent');
    }
  }

  /**
   * Obtener voces disponibles
   */
  static async getVoices(): Promise<RetellVoice[]> {
    try {
      const voices = await retellClient.voice.list();
      return voices as RetellVoice[];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw new Error('Failed to fetch voices');
    }
  }

  /**
   * Obtener una voz específica
   */
  static async getVoice(voiceId: string): Promise<RetellVoice> {
    try {
      const voice = await retellClient.voice.retrieve(voiceId);
      return voice as RetellVoice;
    } catch (error) {
      console.error('Error fetching voice:', error);
      throw new Error('Failed to fetch voice');
    }
  }

  /**
   * Iniciar una llamada
   */
  static async createCall(data: CallData): Promise<CallResponse> {
    try {
      const call = await retellClient.call.createPhoneCall({
        agent_id: data.agent_id,
        from_number: data.from_number,
        to_number: data.to_number,
        metadata: data.metadata,
      });

      return call as CallResponse;
    } catch (error) {
      console.error('Error creating call:', error);
      throw new Error('Failed to create call');
    }
  }

  /**
   * Obtener información de una llamada
   */
  static async getCall(callId: string): Promise<CallResponse> {
    try {
      const call = await retellClient.call.retrieve(callId);
      return call as CallResponse;
    } catch (error) {
      console.error('Error fetching call:', error);
      throw new Error('Failed to fetch call');
    }
  }

  /**
   * Obtener métricas de uso
   */
  static async getUsageMetrics(agentId?: string, startDate?: string, endDate?: string) {
    try {
      // Esta función dependería de la API específica de métricas de Retell
      // Por ahora retornamos datos mock
      return {
        total_calls: 0,
        total_duration: 0,
        total_cost: 0,
        calls_by_agent: {},
        calls_by_date: {},
      };
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      throw new Error('Failed to fetch usage metrics');
    }
  }

  /**
   * Validar configuración de agente
   */
  static validateAgentData(data: CreateAgentData): string[] {
    const errors: string[] = [];

    if (!data.agent_name?.trim()) {
      errors.push('Agent name is required');
    }

    if (!data.voice_id?.trim()) {
      errors.push('Voice ID is required');
    }

    if (!data.language?.trim()) {
      errors.push('Language is required');
    }

    if (!data.prompt?.trim()) {
      errors.push('Prompt is required');
    }

    if (!data.response_engine?.type) {
      errors.push('Response engine type is required');
    }

    if (data.response_engine?.type === 'custom-llm' && !data.response_engine.llm_id) {
      errors.push('LLM ID is required for custom LLM');
    }

    return errors;
  }

  /**
   * Obtener configuración por defecto para un agente
   */
  static getDefaultAgentConfig(): Partial<CreateAgentData> {
    return {
      language: 'en',
      response_engine: {
        type: 'retell-llm',
      },
      webhook_events: ['call_ended', 'call_analyzed'],
    };
  }
}

export default RetellService;
