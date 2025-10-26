/**
 * Ejemplo simplificado usando directamente los tipos del SDK de Retell AI
 * Sin interfaces adicionales innecesarias
 */

import { RetellService } from '@/lib/retell';
import Retell from 'retell-sdk';

// Ejemplo de creación de agente usando directamente los tipos del SDK
export async function createSimpleAgent() {
  try {
    // Usar directamente el tipo del SDK - ¡Mucho más simple!
    const agentData: Retell.Agent.AgentCreateParams = {
      agent_name: 'Simple Agent',
      voice_id: '11labs-Adrian',
      response_engine: {
        type: 'retell-llm',
      },
      language: 'en-US',
    };

    const agent = await RetellService.createAgent(agentData);
    
    console.log('Agente creado exitosamente:');
    console.log('ID:', agent.agent_id);
    console.log('Nombre:', agent.agent_name);
    
    return agent;
  } catch (error) {
    console.error('Error al crear agente:', error);
    throw error;
  }
}

// Ejemplo de agente con configuración avanzada usando tipos del SDK
export async function createAdvancedAgent() {
  try {
    // Todas las opciones avanzadas están disponibles en el tipo del SDK
    const agentData: Retell.Agent.AgentCreateParams = {
      // Configuración básica
      agent_name: 'Advanced Agent',
      voice_id: '11labs-Sarah',
      response_engine: {
        type: 'retell-llm',
      },
      
      // Configuración de voz (disponible en el SDK)
      voice_model: 'eleven_turbo_v2_5',
      voice_temperature: 1.2,
      voice_speed: 1.1,
      volume: 1.1,
      
      // Configuración de interacción (disponible en el SDK)
      responsiveness: 0.9,
      interruption_sensitivity: 0.8,
      enable_backchannel: true,
      backchannel_frequency: 0.7,
      backchannel_words: ['yeah', 'uh-huh', 'I understand'],
      
      // Configuración de ambiente (disponible en el SDK)
      ambient_sound: 'coffee-shop',
      ambient_sound_volume: 0.8,
      
      // Configuración de llamada (disponible en el SDK)
      language: 'en-US',
      webhook_url: 'https://your-webhook.com',
      boosted_keywords: ['customer', 'service', 'help'],
      data_storage_setting: 'everything',
      normalize_for_speech: true,
      end_call_after_silence_ms: 600000,
      max_call_duration_ms: 3600000,
      stt_mode: 'accurate',
      allow_user_dtmf: true,
      denoising_mode: 'noise-cancellation',
      
      // Análisis post-llamada (disponible en el SDK)
      post_call_analysis_data: [
        {
          type: 'string',
          name: 'customer_satisfaction',
          description: 'Overall customer satisfaction rating',
          examples: ['satisfied', 'neutral', 'dissatisfied']
        }
      ],
      post_call_analysis_model: 'gpt-4o-mini',
      
      // Configuración de DTMF (disponible en el SDK)
      user_dtmf_options: {
        digit_limit: 25,
        termination_key: '#',
        timeout_ms: 8000,
      },
      
      // Configuración de PII (disponible en el SDK)
      pii_config: {
        mode: 'post_call',
        categories: ['email', 'phone_number'],
      },
    };

    const agent = await RetellService.createAdvancedAgent(agentData);
    
    console.log('Agente avanzado creado exitosamente:');
    console.log('ID:', agent.agent_id);
    console.log('Nombre:', agent.agent_name);
    console.log('Versión:', agent.version);
    
    return agent;
  } catch (error) {
    console.error('Error al crear agente avanzado:', error);
    throw error;
  }
}

// Ejemplo de uso de plantillas
export async function createAgentFromTemplate() {
  try {
    // Obtener plantillas (ahora usan tipos del SDK)
    const templates = RetellService.getAgentTemplates();
    const customerServiceTemplate = templates['customer-service'];
    
    // Personalizar la plantilla
    const agentData: Retell.Agent.AgentCreateParams = {
      ...customerServiceTemplate,
      agent_name: 'Mi Agente de Servicio',
      voice_id: '11labs-Adrian',
      response_engine: {
        type: 'retell-llm',
      },
    };
    
    const agent = await RetellService.createAdvancedAgent(agentData);
    
    console.log('Agente desde plantilla creado:');
    console.log('ID:', agent.agent_id);
    console.log('Nombre:', agent.agent_name);
    
    return agent;
  } catch (error) {
    console.error('Error al crear agente desde plantilla:', error);
    throw error;
  }
}

// Ejemplo de flujo completo simplificado
export async function completeSimplifiedWorkflow() {
  try {
    console.log('🚀 Iniciando flujo simplificado...\n');

    // 1. Crear agente simple
    console.log('1. Creando agente simple...');
    const simpleAgent = await createSimpleAgent();
    console.log('✅ Agente simple creado\n');

    // 2. Crear agente avanzado
    console.log('2. Creando agente avanzado...');
    const advancedAgent = await createAdvancedAgent();
    console.log('✅ Agente avanzado creado\n');

    // 3. Crear desde plantilla
    console.log('3. Creando desde plantilla...');
    const templateAgent = await createAgentFromTemplate();
    console.log('✅ Agente desde plantilla creado\n');

    // 4. Listar agentes
    console.log('4. Listando agentes...');
    const allAgents = await RetellService.getAgents();
    console.log(`✅ Se encontraron ${allAgents.length} agentes\n`);

    console.log('🎉 Flujo simplificado completado exitosamente!');
    
    return {
      simpleAgent,
      advancedAgent,
      templateAgent,
      totalAgents: allAgents.length,
    };
  } catch (error) {
    console.error('❌ Error en el flujo:', error);
    throw error;
  }
}
