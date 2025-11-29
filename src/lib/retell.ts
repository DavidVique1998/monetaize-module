/**
 * Servicio para integración con Retell AI
 * Maneja la creación, configuración y gestión de agentes
 */

import Retell from 'retell-sdk';
import { config } from './config';

// Inicializar cliente de Retell AI
export const retellClient = new Retell({
  apiKey: config.retell.apiKey,
});

// Tipos para Retell AI usando directamente los tipos oficiales del SDK
export type RetellAgent = Retell.Agent.AgentResponse;
export type RetellAgentWithPrompt = RetellAgent & { prompt?: string };
export type CreateAgentData = Retell.Agent.AgentCreateParams;
export type UpdateAgentData = Retell.Agent.AgentUpdateParams;
export type AdvancedCreateAgentData = Retell.Agent.AgentCreateParams; // Usar directamente el tipo del SDK

// Usar directamente el tipo del SDK para voces
export type RetellVoice = Retell.Voice.VoiceResponse;

export type CallData = Retell.Call.CallCreatePhoneCallParams;
export type CallResponse = Retell.Call.PhoneCallResponse;

// Usar directamente los tipos del SDK para números de teléfono
export type ImportPhoneNumberData = Retell.PhoneNumber.PhoneNumberImportParams;
export type ImportedPhoneNumber = Retell.PhoneNumber.PhoneNumberResponse;

// Servicio principal de Retell AI
export class RetellService {
  /**
   * Crear un nuevo agente
   */
  static async createAgent(data: CreateAgentData): Promise<RetellAgent> {
    try {
      const agent = await retellClient.agent.create(data);
      return agent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new Error('Failed to create agent');
    }
  }

  /**
   * Crear un agente con configuración avanzada
   * Usa directamente el tipo del SDK que ya incluye todas las opciones
   */
  static async createAdvancedAgent(data: Retell.Agent.AgentCreateParams): Promise<RetellAgent> {
    try {
      const agent = await retellClient.agent.create(data);
      return agent;
    } catch (error) {
      console.error('Error creating advanced agent:', error);
      throw new Error('Failed to create advanced agent');
    }
  }

  /**
   * Obtener todos los agentes
   */
  static async getAgents(): Promise<RetellAgent[]> {
    try {
      const response = await retellClient.agent.list();
      return response || [];
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
      console.log('Fetching agent with ID:', agentId);
      const agent = await retellClient.agent.retrieve(agentId);
      console.log('Agent retrieved successfully:', agent.agent_name);
      return agent;
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response
      });
      throw error; // Re-lanzar el error original en lugar de crear uno genérico
    }
  }

  /**
   * Obtener un Retell LLM específico
   */
  static async getRetellLLM(llmId: string): Promise<Retell.Llm.LlmResponse> {
    try {
      const llm = await retellClient.llm.retrieve(llmId);
      return llm;
    } catch (error) {
      console.error('Error fetching Retell LLM:', error);
      throw new Error('Failed to fetch Retell LLM');
    }
  }

  /**
   * Obtener un agente con su prompt desde el LLM
   */
  static async getAgentWithPrompt(agentId: string): Promise<RetellAgentWithPrompt> {
    try {
      console.log('Fetching agent with prompt for ID:', agentId);
      const agent = await retellClient.agent.retrieve(agentId);
      console.log('Agent retrieved:', agent.agent_name);
      let prompt = '';
      
      // Si el agente tiene un llm_id, intentar obtener el prompt del LLM
      if (agent.response_engine && 'llm_id' in agent.response_engine && agent.response_engine.llm_id) {
        console.log('Fetching LLM prompt for llm_id:', agent.response_engine.llm_id);
        try {
          const llm = await retellClient.llm.retrieve(agent.response_engine.llm_id);
          prompt = llm.general_prompt || '';
          console.log('LLM prompt retrieved successfully, length:', prompt.length);
        } catch (error) {
          console.warn('Could not fetch LLM prompt:', error);
          // Continuar sin el prompt si falla
        }
      }
      
      return {
        ...agent,
        prompt
      };
    } catch (error: any) {
      console.error('Error fetching agent from Retell API:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code
      });
      throw error;
    }
  }

  /**
   * Actualizar un agente
   */
  static async updateAgent(agentId: string, data: Partial<UpdateAgentData>): Promise<RetellAgent> {
    try {
      console.log('RetellService: Updating agent:', agentId);
      console.log('RetellService: Update data:', data);
      
      const agent = await retellClient.agent.update(agentId, data);
      
      console.log('RetellService: Agent updated successfully');
      console.log('RetellService: Updated agent version:', agent.version);
      console.log('RetellService: Updated agent is_published:', (agent as any).is_published);
      
      return agent;
    } catch (error: any) {
      console.error('RetellService: Error updating agent:', error);
      console.error('RetellService: Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        response: error?.response
      });
      throw new Error(`Failed to update agent: ${error.message || 'Unknown error'}`);
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
   * Usando el SDK de Retell AI
   */
  static async getVoices(): Promise<RetellVoice[]> {
    try {
      const voiceResponses = await retellClient.voice.list();
      return voiceResponses;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw new Error('Failed to fetch voices');
    }
  }

  /**
   * Obtener una voz específica
   * Usando el SDK de Retell AI
   */
  static async getVoice(voiceId: string): Promise<RetellVoice> {
    try {
      const voice = await retellClient.voice.retrieve(voiceId);
      return voice;
    } catch (error) {
      console.error('Error fetching voice:', error);
      throw new Error('Failed to fetch voice');
    }
  }

  /**
   * Listar todos los Retell LLMs
   */
  static async getRetellLLMs(): Promise<Retell.Llm.LlmResponse[]> {
    try {
      const llms = await retellClient.llm.list();
      return llms || [];
    } catch (error) {
      console.error('Error fetching Retell LLMs:', error);
      throw new Error('Failed to fetch Retell LLMs');
    }
  }

  /**
   * Crear un nuevo Retell LLM
   */
  static async createRetellLLM(data: Retell.Llm.LlmCreateParams): Promise<Retell.Llm.LlmResponse> {
    try {
      const llm = await retellClient.llm.create(data);
      return llm;
    } catch (error) {
      console.error('Error creating Retell LLM:', error);
      throw new Error('Failed to create Retell LLM');
    }
  }

  /**
   * Actualizar un Retell LLM
   */
  static async updateRetellLLM(llmId: string, data: Retell.Llm.LlmUpdateParams): Promise<Retell.Llm.LlmResponse> {
    try {
      const llm = await retellClient.llm.update(llmId, data);
      return llm;
    } catch (error) {
      console.error('Error updating Retell LLM:', error);
      throw new Error('Failed to update Retell LLM');
    }
  }

  /**
   * Iniciar una llamada telefónica
   * NO captura automáticamente en BD - se debe llamar a saveCallData() cuando termine
   */
  static async createCall(data: CallData, userId?: string): Promise<CallResponse> {
    try {
      const call = await retellClient.call.createPhoneCall(data);
      
      // NO guardar en BD aquí - esperar a que termine la llamada para tener todos los datos
      // El registro se creará cuando se llame a saveCallData() con los datos completos
      
      return call;
    } catch (error) {
      console.error('Error creating call:', error);
      throw new Error('Failed to create call');
    }
  }

  /**
   * Crear una llamada web para el cliente web
   * NO captura automáticamente en BD - se debe llamar a saveCallData() cuando termine
   */
  static async createWebCall(agentId: string, userId?: string): Promise<{
    access_token: string;
    call_id: string;
    agent_id: string;
    agent_version: number;
    call_status: string;
    call_type: string;
  }> {
    try {
      // El SDK de Retell usa snake_case para los parámetros
      const response = await retellClient.call.createWebCall({
        agent_id: agentId,
      });
      
      // NO guardar en BD aquí - esperar a que termine la llamada para tener todos los datos
      // El registro se creará cuando se llame a saveCallData() con los datos completos
      
      return response;
    } catch (error) {
      console.error('Error creating web call:', error);
      throw new Error('Failed to create web call');
    }
  }

  /**
   * Guardar datos completos de una llamada en la base de datos
   * Se debe llamar cuando la llamada termine para tener todos los datos (costo, tokens, etc.)
   */
  static async saveCallData(callId: string, userId?: string): Promise<void> {
    try {
      // Obtener datos completos de Retell
      const retellCall = await retellClient.call.retrieve(callId);
      const callData = retellCall as any;

      // Extraer información según la documentación de Retell
      let cost: number | undefined;
      let totalDurationSeconds: number | undefined;
      let tokensUsed: number | undefined;
      let duration: number | undefined;
      let status = callData.call_status || 'ended';

      // Extraer costo desde call_cost.combined_cost
      if (callData.call_cost?.combined_cost !== undefined) {
        cost = callData.call_cost.combined_cost;
      } else if (callData.call_cost) {
        cost = typeof callData.call_cost === 'number' ? callData.call_cost : undefined;
      } else if (callData.cost) {
        cost = callData.cost;
      }

      // Extraer duración total desde call_cost.total_duration_seconds
      if (callData.call_cost?.total_duration_seconds !== undefined) {
        totalDurationSeconds = callData.call_cost.total_duration_seconds;
      } else if (callData.duration_ms) {
        totalDurationSeconds = Math.floor(callData.duration_ms / 1000);
      }

      // Calcular duración si hay start y end time
      if (callData.start_timestamp && callData.end_timestamp) {
        duration = Math.floor((callData.end_timestamp - callData.start_timestamp) / 1000);
      } else if (totalDurationSeconds) {
        duration = totalDurationSeconds;
      }

      // Extraer tokens desde llm_token_usage
      if (callData.llm_token_usage) {
        if (callData.llm_token_usage.average !== undefined) {
          tokensUsed = callData.llm_token_usage.average;
        } else if (Array.isArray(callData.llm_token_usage.values) && callData.llm_token_usage.values.length > 0) {
          tokensUsed = callData.llm_token_usage.values.reduce((sum: number, val: number) => sum + val, 0);
        } else if (typeof callData.llm_token_usage === 'number') {
          tokensUsed = callData.llm_token_usage;
        }
      }

      // Determinar tipo de llamada
      const callType = callData.call_type === 'web_call' ? 'web' : 'phone';
      
      // Determinar dirección
      const direction = callData.from_number ? 'outbound' : 'inbound';

      // Guardar en la base de datos
      const { CallService } = await import('./call-service');
      
      // Verificar si ya existe
      const existingCall = await CallService.getCallByRetellId(callId);
      
      if (existingCall) {
        // Actualizar registro existente con todos los datos finales
        await CallService.updateCall(callId, {
          status,
          duration,
          totalDurationSeconds,
          startTime: callData.start_timestamp ? new Date(callData.start_timestamp) : undefined,
          endTime: callData.end_timestamp ? new Date(callData.end_timestamp) : undefined,
          recordingUrl: callData.recording_url || existingCall.recordingUrl,
          transcript: callData.transcript || existingCall.transcript,
          cost,
          tokensUsed,
          retellMetadata: callData,
        });
      } else {
        // Crear nuevo registro con todos los datos completos
        await CallService.createCall({
          retellCallId: callId,
          callType,
          direction,
          status,
          agentId: callData.agent_id,
          agentVersion: callData.agent_version,
          fromNumber: callData.from_number || undefined,
          toNumber: callData.to_number || undefined,
          userId: userId || undefined,
          cost: cost || undefined,
          totalDurationSeconds: totalDurationSeconds || undefined,
          tokensUsed: tokensUsed || undefined,
          duration: duration || undefined,
          startTime: callData.start_timestamp ? new Date(callData.start_timestamp) : new Date(),
          endTime: callData.end_timestamp ? new Date(callData.end_timestamp) : undefined,
          recordingUrl: callData.recording_url || undefined,
          transcript: callData.transcript || undefined,
          retellMetadata: callData,
        });
      }

      console.log(`[RetellService] Call data saved successfully for ${callId}`);
    } catch (error: any) {
      console.error('[RetellService] Error saving call data:', error);
      throw error;
    }
  }

  /**
   * Verificar si un agente está configurado correctamente para chat
   */
  static async validateAgentForChat(agentId: string): Promise<{
    isValid: boolean;
    agent: RetellAgent | null;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      console.log('Validating agent for chat:', agentId);
      
      // Obtener detalles del agente
      const agent = await retellClient.agent.retrieve(agentId);
      console.log('Agent details:', agent);
      
      // Verificar que el agente existe
      if (!agent) {
        issues.push('Agent not found');
        return { isValid: false, agent: null, issues };
      }
      
      // Verificar que tiene response_engine configurado
      if (!agent.response_engine) {
        issues.push('Agent has no response engine configured');
      } else {
        console.log('Response engine:', agent.response_engine);
        
        // Verificar el tipo de response engine
        if (agent.response_engine.type === 'retell-llm') {
          if (!agent.response_engine.llm_id) {
            issues.push('Retell LLM ID is required for chat functionality');
          } else {
            // Verificar que el LLM existe y tiene prompt
            try {
              console.log('Checking LLM:', agent.response_engine.llm_id);
              const llm = await retellClient.llm.retrieve(agent.response_engine.llm_id);
              console.log('LLM details:', llm);
              
              if (!llm.general_prompt) {
                issues.push('LLM has no prompt configured');
              }
            } catch (llmError: any) {
              console.error('Error retrieving LLM:', llmError);
              issues.push(`Cannot retrieve LLM: ${llmError.message}`);
            }
          }
        } else if (agent.response_engine.type === 'conversation-flow') {
          if (!agent.response_engine.conversation_flow_id) {
            issues.push('Conversation Flow ID is required for chat functionality');
          }
        } else {
          issues.push(`Unsupported response engine type: ${agent.response_engine.type}`);
        }
      }
      
      // Verificar que está publicado
      if (!(agent as any).is_published) {
        issues.push('Agent is not published');
      }
      
      const isValid = issues.length === 0;
      
      if (!isValid) {
        console.log('Agent validation issues:', issues);
      } else {
        console.log('Agent is valid for chat');
      }
      
      return { isValid, agent, issues };
    } catch (error: any) {
      console.error('Error validating agent:', error);
      issues.push(`Error retrieving agent: ${error.message}`);
      return { isValid: false, agent: null, issues };
    }
  }

  /**
   * Obtener un Retell LLM por ID
   */
  static async getRetellLlm(llmId: string): Promise<any> {
    try {
      const llm = await retellClient.llm.retrieve(llmId);
      return llm;
    } catch (error) {
      console.error('Error getting Retell LLM:', error);
      throw new Error('Failed to get Retell LLM');
    }
  }

  /**
   * Publicar un agente usando fetch directo para manejar respuesta vacía
   */
  static async publishAgentDirect(agentId: string): Promise<void> {
    try {
      console.log('RetellService: Publishing agent directly:', agentId);
      console.log('RetellService: API Key configured:', !!config.retell.apiKey);
      
      if (!config.retell.apiKey) {
        throw new Error('Retell API key not configured');
      }
      
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      const response = await fetch(`https://api.retellai.com/publish-agent/${agentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.retell.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('RetellService: Publish response status:', response.status);
      console.log('RetellService: Publish response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RetellService: Publish error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to publish agent'}`);
      }

      // El endpoint retorna 200 sin contenido, esto es normal según la documentación
      console.log('RetellService: Agent published successfully (status 200)');
    } catch (error: any) {
      console.error('RetellService: Error publishing agent:', error);
      throw new Error(`Failed to publish agent: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Publicar un agente y obtener el estado actualizado con LLM
   */
  static async publishAgent(agentId: string): Promise<any> {
    try {
      // Primero publicar el agente
      await this.publishAgentDirect(agentId);
      
      // Luego obtener el agente actualizado con prompt usando el método existente
      console.log('RetellService: Fetching updated agent with prompt after publish...');
      const updatedAgent = await this.getAgentWithPrompt(agentId);
      
      console.log('RetellService: Agent published and status updated:', {
        agent_id: updatedAgent.agent_id,
        version: updatedAgent.version,
        is_published: (updatedAgent as any).is_published,
        has_prompt: !!(updatedAgent as any).prompt,
        prompt_length: (updatedAgent as any).prompt?.length || 0
      });
      
      return updatedAgent;
    } catch (error: any) {
      console.error('RetellService: Error in publishAgent:', error);
      throw error;
    }
  }

  /**
   * Crear un chat con un agente
   */
  static async createChat(agentId: string): Promise<{
    chat_id: string;
    agent_id: string;
    chat_status: string;
    start_timestamp?: number;
    transcript?: string;
    message_with_tool_calls?: any[];
  }> {
    try {
      console.log('Creating chat for agent:', agentId);
      console.log('Retell API Key configured:', !!config.retell.apiKey);
      
      if (!config.retell.apiKey) {
        throw new Error('Retell API key not configured');
      }
      
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      // Validar que el agente esté configurado correctamente para chat
      const validation = await this.validateAgentForChat(agentId);
      
      if (!validation.isValid) {
        throw new Error(`Agent not configured for chat: ${validation.issues.join(', ')}`);
      }

      const response = await retellClient.chat.create({
        agent_id: agentId,
      });
      console.log('Chat created successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Error creating chat:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        response: error?.response
      });
      throw new Error(`Failed to create chat: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Enviar un mensaje a un chat existente
   */
  static async sendChatMessage(chatId: string, content: string): Promise<{
    messages: Array<{
      message_id: string;
      role: string;
      content: string;
      created_timestamp: number;
    }>;
  }> {
    try {
      const response = await retellClient.chat.createChatCompletion({
        chat_id: chatId,
        content: content,
      });
      
      // Filtrar solo mensajes regulares (no tool calls)
      const regularMessages = response.messages.filter((msg: any) => 
        msg.role === 'user' || msg.role === 'agent'
      ).map((msg: any) => ({
        message_id: msg.message_id,
        role: msg.role,
        content: msg.content || '',
        created_timestamp: msg.created_timestamp,
      }));
      
      return { messages: regularMessages };
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw new Error('Failed to send chat message');
    }
  }

  /**
   * Obtener detalles de un chat
   */
  static async getChat(chatId: string): Promise<{
    chat_id: string;
    agent_id: string;
    chat_status: string;
    transcript?: string;
    message_with_tool_calls?: any[];
    start_timestamp?: number;
    end_timestamp?: number;
  }> {
    try {
      const response = await retellClient.chat.retrieve(chatId);
      return response;
    } catch (error) {
      console.error('Error getting chat:', error);
      throw new Error('Failed to get chat');
    }
  }

  /**
   * Terminar un chat
   */
  static async endChat(chatId: string): Promise<void> {
    try {
      await retellClient.chat.end(chatId);
    } catch (error) {
      console.error('Error ending chat:', error);
      throw new Error('Failed to end chat');
    }
  }

  /**
   * Obtener información de una llamada desde Retell
   * NO actualiza automáticamente la BD - usar saveCallData() para guardar
   */
  static async getCall(callId: string): Promise<Retell.Call.CallResponse> {
    try {
      const call = await retellClient.call.retrieve(callId);
      return call;
    } catch (error) {
      console.error('Error fetching call:', error);
      throw new Error('Failed to fetch call');
    }
  }

  /**
   * Crear un nuevo número de teléfono en Retell AI
   * Según la documentación: https://docs.retellai.com/api-references/create-phone-number
   */
  static async createPhoneNumber(data: {
    area_code?: number;
    phone_number?: string;
    inbound_agent_id?: string | null;
    outbound_agent_id?: string | null;
    inbound_agent_version?: number | null;
    outbound_agent_version?: number | null;
    nickname?: string | null;
    inbound_webhook_url?: string | null;
    number_provider?: 'twilio' | 'telnyx';
    country_code?: 'US' | 'CA';
    toll_free?: boolean;
  }): Promise<ImportedPhoneNumber> {
    try {
      console.log('RetellService: Creating phone number with data:', data);
      
      // Usar fetch directo ya que el SDK puede no tener este método
      const response = await fetch('https://api.retellai.com/create-phone-number', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.retell.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Filtrar campos undefined/null para enviar solo los necesarios
          ...Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          )
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('RetellService: Error creating phone number:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create phone number`);
      }

      const result = await response.json();
      console.log('RetellService: Phone number created successfully:', result.phone_number);
      return result;
    } catch (error: any) {
      console.error('RetellService: Error creating phone number:', error);
      throw new Error(`Failed to create phone number: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Importar número de teléfono personalizado
   * Usando el SDK de Retell AI
   */
  static async importPhoneNumber(data: ImportPhoneNumberData): Promise<ImportedPhoneNumber> {
    try {
      console.log('RetellService: Importing phone number with data:', data);
      const phoneNumberResponse = await retellClient.phoneNumber.import(data);
      console.log('RetellService: Phone number imported successfully:', phoneNumberResponse.phone_number);
      return phoneNumberResponse;
    } catch (error: any) {
      console.error('RetellService: Error importing phone number:', error);
      console.error('RetellService: Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        response: error?.response
      });
      
      // Extraer mensaje de error más descriptivo
      let errorMessage = 'Failed to import phone number';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener números de teléfono importados
   * Usando el SDK de Retell AI
   */
  static async getPhoneNumbers(): Promise<ImportedPhoneNumber[]> {
    try {
      const phoneNumbersResponse = await retellClient.phoneNumber.list();
      return phoneNumbersResponse || [];
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      throw new Error('Failed to fetch phone numbers');
    }
  }

  /**
   * Obtener un número de teléfono específico
   * Usando el SDK de Retell AI
   */
  static async getPhoneNumber(phoneNumber: string): Promise<ImportedPhoneNumber> {
    try {
      const phoneNumberResponse = await retellClient.phoneNumber.retrieve(phoneNumber);
      return phoneNumberResponse;
    } catch (error) {
      console.error('Error fetching phone number:', error);
      throw new Error('Failed to fetch phone number');
    }
  }

  /**
   * Actualizar configuración de número de teléfono
   * Usando el SDK de Retell AI
   */
  static async updatePhoneNumber(phoneNumber: string, data: Partial<ImportPhoneNumberData>): Promise<ImportedPhoneNumber> {
    try {
      console.log('RetellService: Updating phone number:', phoneNumber);
      console.log('RetellService: Update data:', data);
      const phoneNumberResponse = await retellClient.phoneNumber.update(phoneNumber, data);
      console.log('RetellService: Phone number updated successfully:', phoneNumberResponse.phone_number);
      return phoneNumberResponse;
    } catch (error: any) {
      console.error('RetellService: Error updating phone number:', error);
      console.error('RetellService: Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        response: error?.response
      });
      
      // Extraer mensaje de error más descriptivo
      let errorMessage = 'Failed to update phone number';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Eliminar número de teléfono
   * Usando el SDK de Retell AI
   */
  static async deletePhoneNumber(phoneNumber: string): Promise<void> {
    try {
      await retellClient.phoneNumber.delete(phoneNumber);
    } catch (error) {
      console.error('Error deleting phone number:', error);
      throw new Error('Failed to delete phone number');
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
  static validateAgentData(data: any): string[] {
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
  static getDefaultAgentConfig(): any {
    return {
      language: 'en-US',
      response_engine: {
        type: 'retell-llm',
        llm_id: '',
      },
      webhook_events: ['call_ended', 'call_analyzed'],
    };
  }

  /**
   * Obtener configuración por defecto para un agente avanzado
   * Usa directamente los tipos del SDK
   */
  static getDefaultAdvancedAgentConfig(): Partial<Retell.Agent.AgentCreateParams> {
    return {
      // Configuración de voz
      voice_temperature: 1,
      voice_speed: 1,
      volume: 1,
      
      // Configuración de interacción
      responsiveness: 1,
      interruption_sensitivity: 1,
      enable_backchannel: false,
      backchannel_frequency: 0.8,
      reminder_trigger_ms: 10000,
      reminder_max_count: 1,
      
      // Configuración de ambiente
      ambient_sound_volume: 1,
      
      // Configuración de llamada
      language: 'en-US',
      webhook_timeout_ms: 10000,
      data_storage_setting: 'everything',
      opt_in_signed_url: false,
      normalize_for_speech: false,
      end_call_after_silence_ms: 600000, // 10 minutos
      max_call_duration_ms: 3600000, // 1 hora
      begin_message_delay_ms: 0,
      ring_duration_ms: 30000, // 30 segundos
      stt_mode: 'fast',
      vocab_specialization: 'general',
      allow_user_dtmf: true,
      denoising_mode: 'noise-cancellation',
      
      // Configuración de análisis post-llamada
      post_call_analysis_model: 'gpt-4o-mini',
      
      // Configuración de DTMF
      user_dtmf_options: {
        digit_limit: 25,
        termination_key: '#',
        timeout_ms: 8000,
      },
      
      // Configuración de PII
      pii_config: {
        mode: 'post_call',
        categories: [],
      },
    };
  }

  /**
   * Validar configuración de agente avanzado
   * Usa directamente los tipos del SDK
   */
  static validateAdvancedAgentData(data: Retell.Agent.AgentCreateParams): string[] {
    const errors: string[] = [];

    // Validaciones básicas
    if (!data.agent_name?.trim()) {
      errors.push('Agent name is required');
    }

    if (!data.voice_id?.trim()) {
      errors.push('Voice ID is required');
    }

    if (!data.response_engine?.type) {
      errors.push('Response engine type is required');
    }

    // Validaciones de voz
    if (data.voice_temperature !== undefined && (data.voice_temperature < 0 || data.voice_temperature > 2)) {
      errors.push('Voice temperature must be between 0 and 2');
    }

    if (data.voice_speed !== undefined && (data.voice_speed < 0.5 || data.voice_speed > 2)) {
      errors.push('Voice speed must be between 0.5 and 2');
    }

    if (data.volume !== undefined && (data.volume < 0 || data.volume > 2)) {
      errors.push('Volume must be between 0 and 2');
    }

    // Validaciones de interacción
    if (data.responsiveness !== undefined && (data.responsiveness < 0 || data.responsiveness > 1)) {
      errors.push('Responsiveness must be between 0 and 1');
    }

    if (data.interruption_sensitivity !== undefined && (data.interruption_sensitivity < 0 || data.interruption_sensitivity > 1)) {
      errors.push('Interruption sensitivity must be between 0 and 1');
    }

    if (data.backchannel_frequency !== undefined && (data.backchannel_frequency < 0 || data.backchannel_frequency > 1)) {
      errors.push('Backchannel frequency must be between 0 and 1');
    }

    // Validaciones de duración
    if (data.end_call_after_silence_ms !== undefined && data.end_call_after_silence_ms < 10000) {
      errors.push('End call after silence must be at least 10,000 ms');
    }

    if (data.max_call_duration_ms !== undefined && (data.max_call_duration_ms < 60000 || data.max_call_duration_ms > 7200000)) {
      errors.push('Max call duration must be between 60,000 ms and 7,200,000 ms');
    }

    if (data.begin_message_delay_ms !== undefined && (data.begin_message_delay_ms < 0 || data.begin_message_delay_ms > 5000)) {
      errors.push('Begin message delay must be between 0 and 5,000 ms');
    }

    if (data.ring_duration_ms !== undefined && (data.ring_duration_ms < 5000 || data.ring_duration_ms > 90000)) {
      errors.push('Ring duration must be between 5,000 ms and 90,000 ms');
    }

    // Validaciones de webhook
    if (data.webhook_url && !this.isValidUrl(data.webhook_url)) {
      errors.push('Webhook URL must be a valid URL');
    }

    if (data.webhook_timeout_ms !== undefined && data.webhook_timeout_ms < 1000) {
      errors.push('Webhook timeout must be at least 1,000 ms');
    }

    return errors;
  }

  /**
   * Crear plantillas de agentes predefinidas
   * Usa directamente los tipos del SDK
   */
  static getAgentTemplates(): Record<string, Partial<Retell.Agent.AgentCreateParams>> {
    return {
      'customer-service': {
        agent_name: 'Customer Service Agent',
        language: 'en-US',
        responsiveness: 0.8,
        interruption_sensitivity: 0.7,
        enable_backchannel: true,
        backchannel_frequency: 0.6,
        reminder_trigger_ms: 15000,
        reminder_max_count: 2,
        ambient_sound: 'call-center',
        stt_mode: 'accurate',
        vocab_specialization: 'general',
        data_storage_setting: 'everything',
        normalize_for_speech: true,
        post_call_analysis_data: [
          {
            type: 'string',
            name: 'customer_satisfaction',
            description: 'Overall customer satisfaction rating',
            examples: ['satisfied', 'neutral', 'dissatisfied']
          },
          {
            type: 'string',
            name: 'issue_resolved',
            description: 'Whether the customer issue was resolved',
            examples: ['yes', 'no', 'partially']
          }
        ]
      },
      'sales-agent': {
        agent_name: 'Sales Agent',
        language: 'en-US',
        responsiveness: 0.9,
        interruption_sensitivity: 0.8,
        enable_backchannel: true,
        backchannel_frequency: 0.7,
        voice_temperature: 1.2,
        voice_speed: 1.1,
        ambient_sound: 'coffee-shop',
        stt_mode: 'fast',
        data_storage_setting: 'everything',
        normalize_for_speech: true,
        post_call_analysis_data: [
          {
            type: 'string',
            name: 'lead_quality',
            description: 'Quality of the lead generated',
            examples: ['hot', 'warm', 'cold']
          },
          {
            type: 'string',
            name: 'next_action',
            description: 'Recommended next action',
            examples: ['follow_up', 'send_proposal', 'schedule_demo']
          }
        ]
      },
      'appointment-scheduler': {
        agent_name: 'Appointment Scheduler',
        language: 'en-US',
        responsiveness: 0.7,
        interruption_sensitivity: 0.6,
        enable_backchannel: true,
        backchannel_frequency: 0.5,
        reminder_trigger_ms: 20000,
        reminder_max_count: 1,
        stt_mode: 'accurate',
        data_storage_setting: 'everything',
        normalize_for_speech: true,
        allow_user_dtmf: true,
        user_dtmf_options: {
          digit_limit: 10,
          termination_key: '#',
          timeout_ms: 10000,
        },
        post_call_analysis_data: [
          {
            type: 'string',
            name: 'appointment_scheduled',
            description: 'Whether an appointment was successfully scheduled',
            examples: ['yes', 'no']
          },
          {
            type: 'string',
            name: 'preferred_time',
            description: 'Customer preferred appointment time',
            examples: ['morning', 'afternoon', 'evening']
          }
        ]
      },
      'technical-support': {
        agent_name: 'Technical Support Agent',
        language: 'en-US',
        responsiveness: 0.6,
        interruption_sensitivity: 0.5,
        enable_backchannel: true,
        backchannel_frequency: 0.4,
        reminder_trigger_ms: 25000,
        reminder_max_count: 3,
        stt_mode: 'accurate',
        vocab_specialization: 'general',
        data_storage_setting: 'everything',
        normalize_for_speech: true,
        post_call_analysis_data: [
          {
            type: 'string',
            name: 'issue_category',
            description: 'Category of technical issue',
            examples: ['hardware', 'software', 'network', 'account']
          },
          {
            type: 'string',
            name: 'resolution_status',
            description: 'Status of issue resolution',
            examples: ['resolved', 'escalated', 'pending']
          }
        ]
      }
    };
  }

  /**
   * Validar número de teléfono en formato E.164
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Validar datos de importación de número de teléfono
   */
  static validatePhoneNumberData(data: ImportPhoneNumberData): string[] {
    const errors: string[] = [];

    if (!data.phone_number?.trim()) {
      errors.push('Phone number is required');
    } else if (!this.validatePhoneNumber(data.phone_number)) {
      errors.push('Phone number must be in E.164 format (e.g., +14157774444)');
    }

    if (!data.termination_uri?.trim()) {
      errors.push('Termination URI is required');
    } else if (!data.termination_uri.endsWith('.pstn.twilio.com') && 
               !data.termination_uri.includes('.')) {
      errors.push('Termination URI must be a valid SIP trunk URI');
    }

    if (data.inbound_agent_id && typeof data.inbound_agent_id !== 'string') {
      errors.push('Inbound agent ID must be a string or null');
    }

    if (data.outbound_agent_id && typeof data.outbound_agent_id !== 'string') {
      errors.push('Outbound agent ID must be a string');
    }

    if (data.inbound_agent_version && (typeof data.inbound_agent_version !== 'number' || data.inbound_agent_version < 1)) {
      errors.push('Inbound agent version must be a positive integer');
    }

    if (data.outbound_agent_version && (typeof data.outbound_agent_version !== 'number' || data.outbound_agent_version < 1)) {
      errors.push('Outbound agent version must be a positive integer');
    }

    if (data.inbound_webhook_url && !this.isValidUrl(data.inbound_webhook_url)) {
      errors.push('Inbound webhook URL must be a valid URL');
    }

    return errors;
  }

  /**
   * Validar URL
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Formatear número de teléfono para mostrar
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Convertir +14157774444 a +1 (415) 777-4444
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const countryCode = cleaned.slice(0, 1);
      const areaCode = cleaned.slice(1, 4);
      const exchange = cleaned.slice(4, 7);
      const number = cleaned.slice(7);
      return `+${countryCode} (${areaCode}) ${exchange}-${number}`;
    }
    return phoneNumber;
  }

  /**
   * Obtener configuración por defecto para importación de número
   */
  static getDefaultPhoneNumberConfig(): Partial<ImportPhoneNumberData> {
    return {
      inbound_agent_version: 1,
      outbound_agent_version: 1,
      nickname: 'Imported Number',
    };
  }
}

export default RetellService;
