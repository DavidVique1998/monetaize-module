import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellService } from '@/lib/retell';
import { RetellSyncService } from '@/lib/retell-sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> | { agentId: string } }
) {
  // Manejar params tanto en Next.js 13+ como versiones anteriores
  const resolvedParams = await params;
  const agentId = typeof resolvedParams.agentId === 'string' ? resolvedParams.agentId : String(resolvedParams.agentId);
  
  console.log('Received agentId in route:', agentId);
  const versionParam = request.nextUrl.searchParams.get('version');
  const version = versionParam ? Number(versionParam) : undefined;
  
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que el agente pertenece al usuario
    const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, agentId);
    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: 'Agent not found or does not belong to your account' },
        { status: 404 }
      );
    }

    // Intentar obtener el agente con el prompt
    const agent = await RetellService.getAgentWithPrompt(agentId, version);
    return NextResponse.json({ success: true, data: agent });
  } catch (error) {
    console.error('Error fetching agent with prompt, trying without:', error);
    
    // Intentar sin el prompt si falla
    try {
      const agent = await RetellService.getAgent(agentId, version);
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
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que el agente pertenece al usuario
    const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, agentId);
    if (!agentExists) {
      console.error(`Agent ownership verification failed for PATCH:`, {
        userId: user.id,
        userEmail: user.email,
        agentId: agentId,
        timestamp: new Date().toISOString()
      });
      
      // Información adicional de debug
      try {
        const allUserAgents = await prisma.agent.findMany({
          where: { userId: user.id },
          select: { id: true, retellAgentId: true, name: true }
        });
        console.error('User agents in database:', allUserAgents);
      } catch (debugError) {
        console.error('Error getting debug info:', debugError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Agent not found or does not belong to your account',
          debug: {
            userId: user.id,
            agentId: agentId,
            suggestion: 'Try using the debug endpoint /api/debug/agents to link the agent'
          }
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('API: Updating agent:', agentId);
    console.log('API: Update data:', body);
    
    // Separar el prompt y llm_model del resto de los datos del agente
    const { prompt, llm_model, ...agentData } = body;
    
    // Actualizar el agente
    const agent = await RetellService.updateAgent(agentId, agentData);
    console.log('API: Agent updated successfully');
    console.log('API: Updated agent version:', agent.version);
    console.log('API: Updated agent is_published:', (agent as any).is_published);
    
    // Si hay prompt o llm_model y el agente tiene un llm_id, actualizar el LLM
    if ((prompt !== undefined || llm_model !== undefined) && agent.response_engine && 'llm_id' in agent.response_engine && agent.response_engine.llm_id) {
      try {
        console.log('API: Updating LLM for:', agent.response_engine.llm_id);
        const updateData: any = {};
        if (prompt !== undefined) updateData.general_prompt = prompt;
        if (llm_model !== undefined) updateData.model = llm_model;
        
        await RetellService.updateRetellLLM(agent.response_engine.llm_id, updateData);
        console.log('API: LLM updated successfully');
      } catch (error) {
        console.warn('Could not update LLM:', error);
      }
    }
    
    return NextResponse.json({ success: true, data: agent });
  } catch (error: any) {
    console.error('API: Error updating agent:', error);
    console.error('API: Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update agent',
        details: error?.message
      },
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
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que el agente pertenece al usuario
    const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, agentId);
    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: 'Agent not found or does not belong to your account' },
        { status: 404 }
      );
    }

    // Eliminar de Retell
    await RetellService.deleteAgent(agentId);
    
    // Eliminar de la base de datos local
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.agent.deleteMany({
      where: {
        userId: user.id,
        retellAgentId: agentId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}

