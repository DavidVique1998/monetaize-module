import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';
import { RetellService } from '@/lib/retell';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Obtener agentes de Retell
    const retellAgents = await RetellService.getAgents();
    
    // Obtener agentes locales del usuario
    const localAgents = await prisma.agent.findMany({
      where: { userId: user.id },
    });

    // Información de debug
    const debugInfo = {
      userId: user.id,
      userEmail: user.email,
      retellAgentsCount: retellAgents.length,
      localAgentsCount: localAgents.length,
      retellAgents: retellAgents.map(a => ({
        agent_id: a.agent_id,
        agent_name: a.agent_name,
        is_published: (a as any).is_published,
        version: (a as any).version
      })),
      localAgents: localAgents.map(a => ({
        id: a.id,
        name: a.name,
        retellAgentId: a.retellAgentId,
        userId: a.userId,
        isActive: a.isActive
      })),
      missingLinks: retellAgents.filter(retellAgent => 
        !localAgents.some(localAgent => localAgent.retellAgentId === retellAgent.agent_id)
      ).map(a => a.agent_id)
    };

    return NextResponse.json({ 
      success: true, 
      data: debugInfo 
    });
  } catch (error: any) {
    console.error('Debug agents error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to debug agents' 
      },
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
    const { action, agentId } = body;

    if (action === 'link_agent' && agentId) {
      // Obtener el agente de Retell
      const retellAgent = await RetellService.getAgent(agentId);
      
      // Verificar si ya existe en la base de datos local
      const existingAgent = await prisma.agent.findFirst({
        where: {
          retellAgentId: agentId,
          userId: user.id
        }
      });

      if (existingAgent) {
        return NextResponse.json({
          success: false,
          error: 'Agent already linked to user'
        });
      }

      // Crear el vínculo en la base de datos local
      const localAgent = await prisma.agent.create({
        data: {
          id: retellAgent.agent_id,
          name: retellAgent.agent_name || 'Unnamed Agent',
          voiceId: retellAgent.voice_id || '',
          language: retellAgent.language || 'en-US',
          llmId: retellAgent.response_engine && 'llm_id' in retellAgent.response_engine
            ? retellAgent.response_engine.llm_id
            : null,
          llmType: retellAgent.response_engine?.type || 'retell-llm',
          version: (retellAgent as any).version || 1,
          isActive: (retellAgent as any).is_published || false,
          retellAgentId: retellAgent.agent_id,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Agent linked successfully',
        data: { localAgent, retellAgent }
      });
    }

    if (action === 'sync_all') {
      // Sincronizar todos los agentes
      await RetellSyncService.syncAgentsForUser(user.id);
      
      return NextResponse.json({
        success: true,
        message: 'All agents synchronized'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    });

  } catch (error: any) {
    console.error('Debug agents POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to perform action' 
      },
      { status: 500 }
    );
  }
}
