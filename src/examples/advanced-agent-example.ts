/**
 * Ejemplo de uso del SDK de Retell AI para agentes avanzados
 * Basado en la documentación oficial con todas las opciones
 */

import { RetellService } from '@/lib/retell';
import Retell from 'retell-sdk';

// Ejemplo de creación de agente de servicio al cliente
export async function createCustomerServiceAgent() {
  try {
    const agentData: Retell.Agent.AgentCreateParams = {
      // Configuración básica
      agent_name: 'Customer Service Agent',
      voice_id: '11labs-Adrian',
      response_engine: {
        type: 'retell-llm',
        llm_id: '',
      },
      
      // Configuración de voz
      voice_model: 'eleven_turbo_v2',
      fallback_voice_ids: ['openai-Alloy', 'deepgram-Angus'],
      voice_temperature: 1.0,
      voice_speed: 1.0,
      volume: 1.0,
      
      // Configuración de interacción
      responsiveness: 0.8,
      interruption_sensitivity: 0.7,
      enable_backchannel: true,
      backchannel_frequency: 0.6,
      backchannel_words: ['yeah', 'uh-huh', 'I understand', 'go on'],
      reminder_trigger_ms: 15000,
      reminder_max_count: 2,
      
      // Configuración de ambiente
      ambient_sound: 'call-center',
      ambient_sound_volume: 0.8,
      
      // Configuración de llamada
      language: 'en-US',
      webhook_url: 'https://your-webhook.com/customer-service',
      webhook_timeout_ms: 10000,
      boosted_keywords: ['customer', 'service', 'help', 'support', 'issue'],
      data_storage_setting: 'everything',
      opt_in_signed_url: true,
      normalize_for_speech: true,
      end_call_after_silence_ms: 600000, // 10 minutos
      max_call_duration_ms: 3600000, // 1 hora
      begin_message_delay_ms: 1000,
      ring_duration_ms: 30000, // 30 segundos
      stt_mode: 'accurate',
      vocab_specialization: 'general',
      allow_user_dtmf: true,
      denoising_mode: 'noise-cancellation',
      
      // Configuración de buzón de voz
      voicemail_option: {
        action: {
          type: 'static_text',
          text: 'Thank you for calling. Please leave your name and number, and we\'ll get back to you within 24 hours.'
        }
      },
      
      // Configuración de análisis post-llamada
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
        },
        {
          type: 'string',
          name: 'escalation_needed',
          description: 'Whether the call needs to be escalated',
          examples: ['yes', 'no']
        }
      ],
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
        categories: ['email', 'phone_number', 'credit_card'],
      },
      
      // Diccionario de pronunciación
      pronunciation_dictionary: [
        {
          word: 'customer',
          alphabet: 'ipa',
          phoneme: 'ˈkʌstəmər'
        },
        {
          word: 'service',
          alphabet: 'ipa',
          phoneme: 'ˈsɜːrvɪs'
        }
      ],
    };

    const agent = await RetellService.createAdvancedAgent(agentData);
    
    console.log('Agente de servicio al cliente creado exitosamente:');
    console.log('ID del agente:', agent.agent_id);
    console.log('Nombre:', agent.agent_name);
    console.log('Versión:', agent.version);
    console.log('Publicado:', agent.is_published);
    
    return agent;
  } catch (error) {
    console.error('Error al crear agente de servicio al cliente:', error);
    throw error;
  }
}

// Ejemplo de creación de agente de ventas
export async function createSalesAgent() {
  try {
    const agentData: Retell.Agent.AgentCreateParams = {
      agent_name: 'Sales Agent',
      voice_id: '11labs-Sarah',
      response_engine: {
        type: 'retell-llm',
        llm_id: '',
      },
      
      // Configuración optimizada para ventas
      voice_model: 'eleven_turbo_v2_5',
      voice_temperature: 1.2, // Más expresivo
      voice_speed: 1.1, // Ligeramente más rápido
      volume: 1.1, // Un poco más alto
      
      // Interacción más dinámica
      responsiveness: 0.9,
      interruption_sensitivity: 0.8,
      enable_backchannel: true,
      backchannel_frequency: 0.7,
      backchannel_words: ['absolutely', 'exactly', 'I see', 'that\'s great'],
      
      // Ambiente más profesional
      ambient_sound: 'coffee-shop',
      ambient_sound_volume: 0.6,
      
      // Configuración de llamada
      language: 'en-US',
      boosted_keywords: ['buy', 'purchase', 'price', 'discount', 'deal', 'offer'],
      data_storage_setting: 'everything',
      normalize_for_speech: true,
      stt_mode: 'fast', // Respuesta más rápida
      
      // Análisis específico para ventas
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
          examples: ['follow_up', 'send_proposal', 'schedule_demo', 'close_deal']
        },
        {
          type: 'string',
          name: 'budget_range',
          description: 'Customer budget range mentioned',
          examples: ['under_1k', '1k_5k', '5k_10k', 'over_10k']
        }
      ],
      post_call_analysis_model: 'gpt-4o',
    };

    const agent = await RetellService.createAdvancedAgent(agentData);
    
    console.log('Agente de ventas creado exitosamente:');
    console.log('ID del agente:', agent.agent_id);
    console.log('Nombre:', agent.agent_name);
    
    return agent;
  } catch (error) {
    console.error('Error al crear agente de ventas:', error);
    throw error;
  }
}

// Ejemplo de creación de agente programador de citas
export async function createAppointmentSchedulerAgent() {
  try {
    const agentData: Retell.Agent.AgentCreateParams = {
      agent_name: 'Appointment Scheduler',
      voice_id: 'openai-Alloy',
      response_engine: {
        type: 'retell-llm',
        llm_id: '',
      },
      
      // Configuración para programación
      voice_temperature: 0.8, // Más consistente
      voice_speed: 0.9, // Un poco más lento para claridad
      
      // Interacción paciente
      responsiveness: 0.7,
      interruption_sensitivity: 0.6,
      enable_backchannel: true,
      backchannel_frequency: 0.5,
      reminder_trigger_ms: 20000,
      reminder_max_count: 1,
      
      // Configuración de llamada
      language: 'en-US',
      stt_mode: 'accurate', // Precisión importante para fechas/horas
      allow_user_dtmf: true,
      user_dtmf_options: {
        digit_limit: 10,
        termination_key: '#',
        timeout_ms: 10000,
      },
      
      // Análisis específico para programación
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
        },
        {
          type: 'string',
          name: 'service_type',
          description: 'Type of service requested',
          examples: ['consultation', 'follow_up', 'emergency']
        }
      ],
    };

    const agent = await RetellService.createAdvancedAgent(agentData);
    
    console.log('Agente programador de citas creado exitosamente:');
    console.log('ID del agente:', agent.agent_id);
    console.log('Nombre:', agent.agent_name);
    
    return agent;
  } catch (error) {
    console.error('Error al crear agente programador de citas:', error);
    throw error;
  }
}

// Ejemplo de uso de plantillas predefinidas
export async function createAgentFromTemplate(templateName: string, customOverrides: Partial<Retell.Agent.AgentCreateParams> = {}) {
  try {
    const templates = RetellService.getAgentTemplates();
    const template = templates[templateName];
    
    if (!template) {
      throw new Error(`Template '${templateName}' not found. Available templates: ${Object.keys(templates).join(', ')}`);
    }
    
    // Combinar plantilla con personalizaciones
    const agentData: Retell.Agent.AgentCreateParams = {
      ...template,
      ...customOverrides,
      // Campos requeridos
      voice_id: customOverrides.voice_id || '11labs-Adrian',
      response_engine: customOverrides.response_engine || { type: 'retell-llm', llm_id: '' },
    };
    
    // Validar datos
    const errors = RetellService.validateAdvancedAgentData(agentData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
    
    const agent = await RetellService.createAdvancedAgent(agentData);
    
    console.log(`Agente creado desde plantilla '${templateName}':`);
    console.log('ID del agente:', agent.agent_id);
    console.log('Nombre:', agent.agent_name);
    
    return agent;
  } catch (error) {
    console.error(`Error al crear agente desde plantilla '${templateName}':`, error);
    throw error;
  }
}

// Ejemplo de flujo completo
export async function completeAdvancedAgentWorkflow() {
  try {
    console.log('🚀 Iniciando flujo de trabajo de agentes avanzados...\n');

    // 1. Crear agente de servicio al cliente
    console.log('1. Creando agente de servicio al cliente...');
    const customerServiceAgent = await createCustomerServiceAgent();
    console.log('✅ Agente de servicio al cliente creado\n');

    // 2. Crear agente de ventas
    console.log('2. Creando agente de ventas...');
    const salesAgent = await createSalesAgent();
    console.log('✅ Agente de ventas creado\n');

    // 3. Crear agente desde plantilla
    console.log('3. Creando agente desde plantilla...');
    const appointmentAgent = await createAgentFromTemplate('appointment-scheduler', {
      voice_id: 'deepgram-Angus',
      agent_name: 'Custom Appointment Scheduler',
    });
    console.log('✅ Agente desde plantilla creado\n');

    // 4. Listar todos los agentes
    console.log('4. Listando todos los agentes...');
    const allAgents = await RetellService.getAgents();
    console.log(`✅ Se encontraron ${allAgents.length} agentes\n`);

    console.log('🎉 Flujo de trabajo de agentes avanzados completado exitosamente!');
    
    return {
      customerServiceAgent,
      salesAgent,
      appointmentAgent,
      totalAgents: allAgents.length,
    };
  } catch (error) {
    console.error('❌ Error en el flujo de trabajo:', error);
    throw error;
  }
}
