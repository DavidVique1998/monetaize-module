import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function GET(request: NextRequest) {
  try {
    // Obtener agentes directamente de Retell
    const retellAgents = await RetellService.getAgents();
    return NextResponse.json({ success: true, data: retellAgents });
  } catch (error) {
    console.error('Error in agents API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Crear en Retell usando directamente el método createAdvancedAgent para soportar todos los campos
    const retellAgent = await RetellService.createAdvancedAgent(body);
    
    // Opcional: guardar en la base de datos local (comentado por ahora)
    /*
    try {
      await prisma.agent.create({
        data: {
          id: retellAgent.agent_id,
          name: retellAgent.agent_name,
          voiceId: retellAgent.voice_id,
          language: retellAgent.language,
          prompt: retellAgent.prompt,
          llmId: retellAgent.response_engine?.llm_id,
          llmType: retellAgent.response_engine?.type,
          version: retellAgent.version,
          retellAgentId: retellAgent.agent_id,
          createdAt: new Date(retellAgent.last_modification_timestamp),
          updatedAt: new Date(retellAgent.last_modification_timestamp),
        },
      });
    } catch (dbError) {
      console.error('Error saving agent to DB:', dbError);
      // Continuar aunque falle la DB local
    }
    */
    
    return NextResponse.json({ success: true, data: retellAgent });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
