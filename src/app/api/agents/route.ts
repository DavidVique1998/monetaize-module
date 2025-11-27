import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';

export async function GET(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener agentes del usuario (solo los que pertenecen a su cuenta)
    const userAgents = await RetellSyncService.getUserAgents(user.id);
    
    return NextResponse.json({ success: true, data: userAgents });
  } catch (error) {
    console.error('Error in agents API:', error);
    
    // Si es error de autenticación
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Crear agente en Retell y vincularlo con el usuario en la DB local
    const { retellAgent, localAgent } = await RetellSyncService.createAgentForUser(
      user.id,
      body
    );
    
    return NextResponse.json({ 
      success: true, 
      data: retellAgent,
      localAgent: localAgent 
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    
    // Si es error de autenticación
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create agent';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
