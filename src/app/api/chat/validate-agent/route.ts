import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Validating agent for chat:', agentId);

    // Validar el agente
    const validation = await RetellService.validateAgentForChat(agentId);

    // Obtener información del LLM si existe
    let llmInfo = null;
    if (validation.agent?.response_engine?.type === 'retell-llm' && validation.agent.response_engine.llm_id) {
      try {
        const llm = await RetellService.getRetellLlm(validation.agent.response_engine.llm_id);
        const llmIsPublished = (llm as any).is_published === true || (llm as any).is_draft === false || Boolean((llm as any).last_published_timestamp);
        llmInfo = {
          llm_id: llm.llm_id,
          prompt: llm.general_prompt ? 'Configured' : 'Not configured',
          prompt_length: llm.general_prompt?.length || 0,
          is_published: llmIsPublished
        };
      } catch (error) {
        console.error('Error getting LLM info:', error);
      }
    }

      return NextResponse.json({
        isValid: validation.isValid,
        issues: validation.issues,
        agent: validation.agent ? {
          agent_id: validation.agent.agent_id,
          agent_name: validation.agent.agent_name,
          version: validation.agent.version,
          validated_version: (validation.agent as any).validated_version,
          published_version: (validation.agent as any).published_version,
          response_engine: validation.agent.response_engine,
          llm_info: llmInfo
        } : null
      });
  } catch (error: any) {
    console.error('API Error validating agent:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to validate agent',
        isValid: false,
        issues: [error.message || 'Unknown error']
      },
      { status: 500 }
    );
  }
}
