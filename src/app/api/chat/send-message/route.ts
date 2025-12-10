import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';
import { SessionManager } from '@/lib/session';
import { consumeCredits, getOrCreateWallet } from '@/lib/wallet';

export async function POST(request: NextRequest) {
  try {
    const { chatId, content } = await request.json();

    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'Chat ID and content are required' },
        { status: 400 }
      );
    }

    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Verificar balance antes de enviar mensaje
    // Costo por mensaje de chat (simulado): 1 centavo
    // En producción se podría calcular por tokens
    const MESSAGE_COST_CENTS = 1;
    
    const wallet = await getOrCreateWallet(user.id);
    if (Number(wallet.balance) < MESSAGE_COST_CENTS) {
        return NextResponse.json(
            { error: 'Insufficient balance' },
            { status: 402 }
        );
    }

    // Enviar mensaje usando el servicio de Retell
    const response = await RetellService.sendChatMessage(chatId, content);

    // Consumir créditos después de éxito
    await consumeCredits({
        walletId: wallet.id,
        amount: MESSAGE_COST_CENTS,
        metricType: 'chat_message',
        description: `Chat message in simulation (${chatId})`,
        conversationId: chatId
    });

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
