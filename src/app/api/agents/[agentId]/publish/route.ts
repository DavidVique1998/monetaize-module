import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Publishing agent:', agentId);
    console.log('API: Agent ID from params:', agentId);

    // Publicar el agente usando el servicio de Retell
    const updatedAgent = await RetellService.publishAgent(agentId);

    console.log('API: Agent published successfully');
    console.log('API: Updated agent:', {
      agent_id: updatedAgent.agent_id,
      version: updatedAgent.version,
      is_published: (updatedAgent as any).is_published
    });

    return NextResponse.json({
      success: true,
      data: updatedAgent
    });
  } catch (error: any) {
    console.error('API Error publishing agent:', error);
    console.error('API Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to publish agent',
        success: false,
        details: error?.message
      },
      { status: 500 }
    );
  }
}
