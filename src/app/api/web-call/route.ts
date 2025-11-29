import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';
import { SessionManager } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Crear la llamada web usando el servicio de Retell (con captura automática en BD)
    const webCall = await RetellService.createWebCall(agentId, user.id);

    return NextResponse.json({
      access_token: webCall.access_token,
      call_id: webCall.call_id,
      agent_id: webCall.agent_id,
    });
  } catch (error: any) {
    console.error('Error creating web call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create web call' },
      { status: 500 }
    );
  }
}

