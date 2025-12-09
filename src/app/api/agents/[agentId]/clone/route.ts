import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellService } from '@/lib/retell';
import { RetellSyncService } from '@/lib/retell-sync';
import { z } from 'zod';

const cloneAgentSchema = z.object({
  name: z.string().min(1, 'El nombre del agente es requerido'),
});

/**
 * POST /api/agents/[agentId]/clone
 * 
 * Clona un agente existente con un nuevo nombre
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> | { agentId: string } }
) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const agentId = typeof resolvedParams.agentId === 'string' 
      ? resolvedParams.agentId 
      : String(resolvedParams.agentId);

    // Verificar que el agente pertenece al usuario
    const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, agentId);
    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: 'Agent not found or does not belong to your account' },
        { status: 404 }
      );
    }

    // Obtener el agente original con todos sus datos
    const originalAgent = await RetellService.getAgentWithPrompt(agentId);
    
    // Validar el body
    const body = await request.json();
    const validatedData = cloneAgentSchema.parse(body);

    // Preparar datos del agente clonado
    // Copiar todas las propiedades del agente original excepto el nombre
    const clonedAgentData: any = {
      agent_name: validatedData.name,
      voice_id: originalAgent.voice_id,
      language: originalAgent.language,
      response_engine: originalAgent.response_engine,
    };

    // Copiar configuraciones opcionales si existen
    if (originalAgent.voice_model) clonedAgentData.voice_model = originalAgent.voice_model;
    if (originalAgent.voice_temperature !== undefined) clonedAgentData.voice_temperature = originalAgent.voice_temperature;
    if (originalAgent.voice_speed !== undefined) clonedAgentData.voice_speed = originalAgent.voice_speed;
    if (originalAgent.volume !== undefined) clonedAgentData.volume = originalAgent.volume;
    if (originalAgent.responsiveness !== undefined) clonedAgentData.responsiveness = originalAgent.responsiveness;
    if (originalAgent.interruption_sensitivity !== undefined) clonedAgentData.interruption_sensitivity = originalAgent.interruption_sensitivity;
    if (originalAgent.enable_backchannel !== undefined) clonedAgentData.enable_backchannel = originalAgent.enable_backchannel;
    if (originalAgent.backchannel_frequency !== undefined) clonedAgentData.backchannel_frequency = originalAgent.backchannel_frequency;
    if (originalAgent.stt_mode) clonedAgentData.stt_mode = originalAgent.stt_mode;
    if (originalAgent.vocab_specialization) clonedAgentData.vocab_specialization = originalAgent.vocab_specialization;
    if (originalAgent.denoising_mode) clonedAgentData.denoising_mode = originalAgent.denoising_mode;
    if (originalAgent.max_call_duration_ms !== undefined) clonedAgentData.max_call_duration_ms = originalAgent.max_call_duration_ms;
    if (originalAgent.end_call_after_silence_ms !== undefined) clonedAgentData.end_call_after_silence_ms = originalAgent.end_call_after_silence_ms;
    if (originalAgent.ring_duration_ms !== undefined) clonedAgentData.ring_duration_ms = originalAgent.ring_duration_ms;
    if (originalAgent.begin_message_delay_ms !== undefined) clonedAgentData.begin_message_delay_ms = originalAgent.begin_message_delay_ms;
    if (originalAgent.allow_user_dtmf !== undefined) clonedAgentData.allow_user_dtmf = originalAgent.allow_user_dtmf;
    if (originalAgent.ambient_sound) clonedAgentData.ambient_sound = originalAgent.ambient_sound;
    if (originalAgent.post_call_analysis_model) clonedAgentData.post_call_analysis_model = originalAgent.post_call_analysis_model;
    if (originalAgent.data_storage_setting) clonedAgentData.data_storage_setting = originalAgent.data_storage_setting;
    if (originalAgent.opt_in_signed_url !== undefined) clonedAgentData.opt_in_signed_url = originalAgent.opt_in_signed_url;
    if (originalAgent.normalize_for_speech !== undefined) clonedAgentData.normalize_for_speech = originalAgent.normalize_for_speech;
    if (originalAgent.webhook_url) clonedAgentData.webhook_url = originalAgent.webhook_url;

    // Si el agente tiene un LLM de Retell, crear uno nuevo con el mismo prompt
    if (originalAgent.response_engine?.type === 'retell-llm' && originalAgent.response_engine.llm_id) {
      try {
        // Obtener el LLM original para copiar su configuración
        const originalLLM = await RetellService.getRetellLLM(originalAgent.response_engine.llm_id);
        const llmData = originalLLM as any;
        
        // Preparar datos del nuevo LLM
        const newLLMData: any = {
          general_prompt: llmData.general_prompt || (originalAgent as any).prompt || '',
          model: llmData.model || 'gpt-4o',
        };
        
        // Copiar campos opcionales si existen (usando as any para evitar errores de tipo)
        if (llmData.model_temperature !== undefined) newLLMData.model_temperature = llmData.model_temperature;
        if (llmData.general_tools && Array.isArray(llmData.general_tools)) {
          newLLMData.general_tools = llmData.general_tools;
        }
        if (llmData.knowledge_base_ids && Array.isArray(llmData.knowledge_base_ids)) {
          newLLMData.knowledge_base_ids = llmData.knowledge_base_ids;
        }
        if (llmData.begin_message !== undefined) newLLMData.begin_message = llmData.begin_message;
        if (llmData.start_speaker !== undefined) newLLMData.start_speaker = llmData.start_speaker;
        
        // Crear un nuevo LLM con la misma configuración
        const newLLM = await RetellService.createRetellLLM(newLLMData);
        
        // Usar el nuevo LLM en el agente clonado
        clonedAgentData.response_engine = {
          type: 'retell-llm',
          llm_id: newLLM.llm_id,
        };
      } catch (error) {
        console.error('Error cloning LLM, will create agent with new LLM later:', error);
        // Si falla al clonar el LLM, intentaremos crear uno nuevo después
      }
    }

    // Crear el agente clonado en Retell y vincularlo al usuario
    const { retellAgent, localAgent } = await RetellSyncService.createAgentForUser(
      user.id,
      clonedAgentData
    );

    // Si el agente original tenía un prompt y el agente clonado tiene un LLM, actualizar el prompt
    if ((originalAgent as any).prompt) {
      try {
        // Si el agente clonado tiene un LLM de Retell, actualizar su prompt
        if (retellAgent.response_engine?.type === 'retell-llm' && retellAgent.response_engine.llm_id) {
          await RetellService.updateRetellLLM(retellAgent.response_engine.llm_id, {
            general_prompt: (originalAgent as any).prompt
          } as any);
        }
      } catch (error) {
        console.warn('Could not update cloned LLM prompt:', error);
        // No fallar si no se puede actualizar el prompt, el agente ya está creado
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        agent: retellAgent,
        localAgent,
      },
      message: 'Agente clonado exitosamente',
    });
  } catch (error: any) {
    console.error('Error cloning agent:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos',
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to clone agent'
      },
      { status: 500 }
    );
  }
}

