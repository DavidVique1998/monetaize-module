import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';
import { RetellService } from '@/lib/retell';
import { config } from '@/lib/config';
import { z } from 'zod';

// Schema de validación para crear agente según documentación de Retell AI
const createAgentSchema = z.object({
  // Parámetros requeridos según Retell AI
  agent_name: z.string().min(1, 'agent_name es requerido'),
  voice_id: z.string().min(1, 'voice_id es requerido'),
  language: z.string().min(1, 'language es requerido'),
  response_engine: z.object({
    type: z.enum(['retell-llm', 'custom-llm', 'conversation-flow']),
    llm_id: z.string().optional(), // Requerido para retell-llm y custom-llm
    conversation_flow_id: z.string().optional(), // Requerido para conversation-flow
  }),
  // Parámetros opcionales
  voice_model: z.string().optional(),
  voice_temperature: z.number().min(0).max(2).optional(),
  voice_speed: z.number().min(0.5).max(2).optional(),
  volume: z.number().min(0).max(2).optional(),
  responsiveness: z.number().min(0).max(1).optional(),
  interruption_sensitivity: z.number().min(0).max(1).optional(),
  enable_backchannel: z.boolean().optional(),
  backchannel_frequency: z.number().min(0).max(1).optional(),
  stt_mode: z.enum(['fast', 'accurate']).optional(),
  vocab_specialization: z.string().optional(),
  denoising_mode: z.string().optional(),
  max_call_duration_ms: z.number().optional(),
  end_call_after_silence_ms: z.number().optional(),
  ring_duration_ms: z.number().optional(),
  begin_message_delay_ms: z.number().optional(),
  allow_user_dtmf: z.boolean().optional(),
  ambient_sound: z.string().optional(),
  post_call_analysis_model: z.string().optional(),
  data_storage_setting: z.enum(['everything', 'everything_except_pii', 'basic_attributes_only']).optional(),
  opt_in_signed_url: z.boolean().optional(),
  normalize_for_speech: z.boolean().optional(),
  webhook_url: z.string().url().optional(),
  webhook_timeout_ms: z.number().optional(),
  webhook_events: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener agentes del usuario (solo los que pertenecen a su cuenta)
    const userAgents = await RetellSyncService.getUserAgents(user.id);
    
    return NextResponse.json({ success: true, data: userAgents });
  } catch (error) {
    console.error('Error in agents API:', error);
    
    // Si es error de autenticación
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents - Crear un nuevo agente
 * 
 * Body debe incluir los parámetros requeridos según Retell AI:
 * - agent_name (requerido)
 * - voice_id (requerido)
 * - language (requerido)
 * - response_engine (requerido) con type y llm_id o conversation_flow_id
 * 
 * Si no se proporciona llm_id, se creará uno por defecto
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar datos del request
    const validatedData = createAgentSchema.parse(body);
    
    // Si response_engine es retell-llm o custom-llm y no tiene llm_id, crear uno por defecto
    let agentData = { ...validatedData };
    
    // Si no se proporciona webhook_url, usar el webhook por defecto de la aplicación
    if (!agentData.webhook_url) {
      agentData.webhook_url = `${config.app.url}/api/webhooks/retell`;
      console.log(`[Agents API] Configurando webhook por defecto para agente: ${agentData.webhook_url}`);
    }
    
    if (
      (validatedData.response_engine.type === 'retell-llm' || 
       validatedData.response_engine.type === 'custom-llm') &&
      !validatedData.response_engine.llm_id
    ) {
      try {
        // Intentar obtener un LLM existente
        const llms = await RetellService.getRetellLLMs();
        
        if (llms.length > 0) {
          agentData.response_engine.llm_id = llms[0].llm_id;
        } else {
          // Crear un nuevo Retell LLM con configuración por defecto
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
          agentData.response_engine.llm_id = newLLM.llm_id;
        }
      } catch (llmError) {
        console.error('Error getting or creating Retell LLM:', llmError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to get or create Retell LLM. Please provide llm_id or ensure your API key has proper permissions.' 
          },
          { status: 400 }
        );
      }
    }
    
    // Crear agente en Retell y vincularlo con el usuario en la DB local
    const { retellAgent, localAgent } = await RetellSyncService.createAgentForUser(
      user.id,
      agentData
    );
    
    return NextResponse.json({ 
      success: true, 
      data: retellAgent,
      localAgent: localAgent 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    
    // Si es error de autenticación
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Si es error de validación de Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create agent';
    
    // Manejar errores específicos de Retell
    if (errorMessage.includes('voice_id') || errorMessage.includes('voice')) {
      return NextResponse.json(
        { success: false, error: `Error con la voz: ${errorMessage}` },
        { status: 400 }
      );
    }
    
    if (errorMessage.includes('llm_id') || errorMessage.includes('LLM')) {
      return NextResponse.json(
        { success: false, error: `Error con el LLM: ${errorMessage}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
