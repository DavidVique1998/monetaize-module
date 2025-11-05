import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function POST(request: NextRequest) {
  try {
    const { chatId, content } = await request.json();

    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'Chat ID and content are required' },
        { status: 400 }
      );
    }

    // Enviar mensaje usando el servicio de Retell
    const response = await RetellService.sendChatMessage(chatId, content);

    return NextResponse.json({
      messages: response.messages,
    });
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send chat message' },
      { status: 500 }
    );
  }
}
