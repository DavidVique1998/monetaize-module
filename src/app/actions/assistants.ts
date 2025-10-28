'use server';

import { RetellService } from '@/lib/retell';
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
 * Creates an assistant with minimal default configuration
 */
export async function createBlankAssistant(): Promise<CreateAssistantResult> {
  try {
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
      // Try to list existing LLMs
      const llms = await RetellService.getRetellLLMs();
      
      if (llms.length > 0) {
        // Use the first available LLM
        llmId = llms[0].llm_id;
      } else {
        // Create a new Retell LLM with default settings
        const newLLM = await RetellService.createRetellLLM({
          general_prompt: 'You are a helpful assistant.',
          general_tools: [
            {
              type: 'end_call',
              name: 'end_call',
              description: 'End the call with the user.',
            } as any,
          ],
          start_speaker: 'agent',
          begin_message: 'Hello, how can I help you?',
        });
        llmId = newLLM.llm_id;
      }
    } catch (llmError) {
      console.error('Error getting or creating Retell LLM:', llmError);
      return {
        success: false,
        error: 'Failed to get or create Retell LLM. Please ensure your API key is valid and has proper permissions.',
      };
    }

    // Create a minimal agent with default configuration
    const agentData: Retell.Agent.AgentCreateParams = {
      agent_name: 'New Blank Assistant',
      voice_id: '11labs-Emily',
      language: 'en-US',
      response_engine: {
        type: 'retell-llm',
        llm_id: llmId,
      },
    };

    // Create the agent using the Retell service
    const agent = await RetellService.createAdvancedAgent(agentData);

    if (!agent.agent_id) {
      throw new Error('Agent creation failed: agent_id is missing');
    }

    return {
      success: true,
      data: {
        agent_id: agent.agent_id,
        agent_name: agent.agent_name || 'New Blank Assistant',
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

