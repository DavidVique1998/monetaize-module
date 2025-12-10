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

    console.log('API: Creating chat for agent:', agentId);

    // Crear el chat usando el servicio de Retell
    const chat = await RetellService.createChat(agentId);

    console.log('API: Chat created successfully:', chat);

    return NextResponse.json({
      chat_id: chat.chat_id,
      agent_id: chat.agent_id,
      chat_status: chat.chat_status,
      ephemeral_agent_id: (chat as any).ephemeral_agent_id // Retornar esto al frontend
    });
  } catch (error: any) {
    console.error('API Error creating chat:', error);
    console.error('API Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create chat',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}
