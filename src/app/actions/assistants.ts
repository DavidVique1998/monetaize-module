'use server';

import { RetellService } from '@/lib/retell';
import { RetellSyncService } from '@/lib/retell-sync';
import { SessionManager } from '@/lib/session';
import Retell from 'retell-sdk';

interface CreateAssistantResult {
  success: boolean;
  data?: {
    agent_id: string;
    agent_name: string;
    [key: string]: any;
  };
  error?: string;
}

/**
 * Server action to create a blank assistant
 * Creates an assistant with minimal default configuration and links it to the user
 */
export async function createBlankAssistant(): Promise<CreateAssistantResult> {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.getSessionUser();
    
    if (!user) {
      return {
        success: false,
        error: 'No autenticado. Por favor inicia sesión.',
      };
    }

    // Check if API key is configured
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey || apiKey === 'your_retell_api_key_here') {
      const envMessage = process.env.NODE_ENV === 'production' 
        ? 'RETELL_API_KEY environment variable is not configured in your hosting platform (Vercel). Please add it in your environment settings.'
        : 'RETELL_API_KEY is not configured. Please set up your Retell API key in the .env.local file for development.';
      
      return {
        success: false,
        error: envMessage,
      };
    }

    // First, get or create a Retell LLM Response Engine
    let llmId: string;
    
    try {
      const newLLM = await RetellService.createRetellLLM({
        general_prompt: 'Eres un asistente de IA que responde preguntas y ayuda con tareas.',
        general_tools: [
          {
            type: 'end_call',
            name: 'end_call',
            description: 'End the call with the user.',
          } as any,
        ],
        start_speaker: 'agent',
        begin_message: '',
      });
      llmId = newLLM.llm_id;
      
    } catch (llmError) {
      console.error('Error getting or creating Retell LLM:', llmError);
      return {
        success: false,
        error: 'Failed to get or create Retell LLM. Please ensure your API key is valid and has proper permissions.',
      };
    }

    // Get default webhook URL from config
    const { config } = await import('@/lib/config');
    const webhookUrl = `${config.app.url}/api/webhooks/retell`;

    // Create a minimal agent according to Retell AI documentation
    // Minimum required fields: response_engine (with type and llm_id) and voice_id
    // Reference: https://docs.retellai.com/api-references/create-agent
    const agentData: Retell.Agent.AgentCreateParams = {
      response_engine: {
        type: 'retell-llm',
        llm_id: llmId,
      },
      voice_id: '11labs-Emily', // Required field
      // Optional fields for better UX
      agent_name: 'New Blank Assistant',
      language: 'en-US',
      webhook_url: webhookUrl, // Configurar webhook por defecto para registrar llamadas
    };

    // Create the agent using RetellSyncService which links it to the user in the database
    const { retellAgent } = await RetellSyncService.createAgentForUser(user.id, agentData);

    if (!retellAgent.agent_id) {
      throw new Error('Agent creation failed: agent_id is missing');
    }

    return {
      success: true,
      data: {
        agent_id: retellAgent.agent_id,
        agent_name: retellAgent.agent_name || 'New Blank Assistant',
      },
    };
  } catch (error) {
    console.error('Error creating blank assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create assistant';
    
    // Provide more helpful error messages
    let userFriendlyError = errorMessage;
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      userFriendlyError = 'Invalid Retell API credentials. Please check your RETELL_API_KEY.';
    } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      userFriendlyError = 'Access denied. Please verify your Retell API key permissions.';
    } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      userFriendlyError = 'Network error. Please check your internet connection and Retell API status.';
    }
    
    return {
      success: false,
      error: userFriendlyError,
    };
  }
}

