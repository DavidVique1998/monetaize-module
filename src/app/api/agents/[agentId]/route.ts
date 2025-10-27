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
    
    // Separar el prompt del resto de los datos del agente
    const { prompt, ...agentData } = body;
    
    // Actualizar el agente
    const agent = await RetellService.updateAgent(agentId, agentData);
    
    // Si hay prompt y el agente tiene un llm_id, actualizar el LLM
    if (prompt !== undefined && agent.response_engine && 'llm_id' in agent.response_engine && agent.response_engine.llm_id) {
      try {
        await RetellService.updateRetellLLM(agent.response_engine.llm_id, {
          general_prompt: prompt
        } as any);
      } catch (error) {
        console.warn('Could not update LLM prompt:', error);
      }
    }
    
    return NextResponse.json({ success: true, data: agent });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
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

