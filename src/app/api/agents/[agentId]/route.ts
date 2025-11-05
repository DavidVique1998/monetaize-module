import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> | { agentId: string } }
) {
  // Manejar params tanto en Next.js 13+ como versiones anteriores
  const resolvedParams = await params;
  const agentId = typeof resolvedParams.agentId === 'string' ? resolvedParams.agentId : String(resolvedParams.agentId);
  
  console.log('Received agentId in route:', agentId);
  
  try {
    // Intentar obtener el agente con el prompt
    const agent = await RetellService.getAgentWithPrompt(agentId);
    return NextResponse.json({ success: true, data: agent });
  } catch (error) {
    console.error('Error fetching agent with prompt, trying without:', error);
    
    // Intentar sin el prompt si falla
    try {
      const agent = await RetellService.getAgent(agentId);
      return NextResponse.json({ success: true, data: { ...agent, prompt: '' } });
    } catch (fallbackError) {
      console.error('Error fetching agent even without prompt:', fallbackError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch agent' },
        { status: 500 }
      );
    }
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> | { agentId: string } }
) {
  // Manejar params tanto en Next.js 13+ como versiones anteriores
  const resolvedParams = await params;
  const agentId = typeof resolvedParams.agentId === 'string' ? resolvedParams.agentId : String(resolvedParams.agentId);
  
  try {
    const body = await request.json();
    console.log('API: Updating agent:', agentId);
    console.log('API: Update data:', body);
    
    // Separar el prompt del resto de los datos del agente
    const { prompt, ...agentData } = body;
    
    // Actualizar el agente
    const agent = await RetellService.updateAgent(agentId, agentData);
    console.log('API: Agent updated successfully');
    console.log('API: Updated agent version:', agent.version);
    console.log('API: Updated agent is_published:', (agent as any).is_published);
    
    // Si hay prompt y el agente tiene un llm_id, actualizar el LLM
    if (prompt !== undefined && agent.response_engine && 'llm_id' in agent.response_engine && agent.response_engine.llm_id) {
      try {
        console.log('API: Updating LLM prompt for:', agent.response_engine.llm_id);
        await RetellService.updateRetellLLM(agent.response_engine.llm_id, {
          general_prompt: prompt
        } as any);
        console.log('API: LLM prompt updated successfully');
      } catch (error) {
        console.warn('Could not update LLM prompt:', error);
      }
    }
    
    return NextResponse.json({ success: true, data: agent });
  } catch (error: any) {
    console.error('API: Error updating agent:', error);
    console.error('API: Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update agent',
        details: error?.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> | { agentId: string } }
) {
  // Manejar params tanto en Next.js 13+ como versiones anteriores
  const resolvedParams = await params;
  const agentId = typeof resolvedParams.agentId === 'string' ? resolvedParams.agentId : String(resolvedParams.agentId);
  
  try {
    await RetellService.deleteAgent(agentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}

