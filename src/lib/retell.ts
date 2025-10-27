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
      const agent = await retellClient.agent.update(agentId, data);
      return agent;
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
   * Iniciar una llamada
   */
  static async createCall(data: CallData): Promise<CallResponse> {
    try {
      const call = await retellClient.call.createPhoneCall(data);
      return call;
    } catch (error) {
      console.error('Error creating call:', error);
      throw new Error('Failed to create call');
    }
  }

  /**
   * Obtener información de una llamada
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
   * Importar número de teléfono personalizado
   * Usando el SDK de Retell AI
   */
  static async importPhoneNumber(data: ImportPhoneNumberData): Promise<ImportedPhoneNumber> {
    try {
      const phoneNumberResponse = await retellClient.phoneNumber.import(data);
      return phoneNumberResponse;
    } catch (error) {
      console.error('Error importing phone number:', error);
      throw new Error('Failed to import phone number');
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
      const phoneNumberResponse = await retellClient.phoneNumber.update(phoneNumber, data);
      return phoneNumberResponse;
    } catch (error) {
      console.error('Error updating phone number:', error);
      throw new Error('Failed to update phone number');
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
