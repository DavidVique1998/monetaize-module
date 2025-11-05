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

    // Crear la llamada web usando el servicio de Retell
    const webCall = await RetellService.createWebCall(agentId);

    return NextResponse.json({
      access_token: webCall.access_token,
      call_id: webCall.call_id,
    });
  } catch (error: any) {
    console.error('Error creating web call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create web call' },
      { status: 500 }
    );
  }
}

