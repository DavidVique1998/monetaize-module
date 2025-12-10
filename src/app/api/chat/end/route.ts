import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function PATCH(request: NextRequest) {
  try {
    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Terminar el chat usando el servicio de Retell
    // Si la llamada incluyó ephemeral_agent_id en el cuerpo (opcional), podríamos limpiarlo aquí.
    // Por ahora RetellService.endChat maneja la terminación de la sesión.
    await RetellService.endChat(chatId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error ending chat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to end chat' },
      { status: 500 }
    );
  }
}
