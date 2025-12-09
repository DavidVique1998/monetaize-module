import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const moveAgentSchema = z.object({
  agentId: z.string().min(1, 'agentId es requerido'),
  folderId: z.string().nullable().optional(), // null para mover a "sin carpeta"
});

/**
 * POST /api/agents/move
 * Mover un agente a una carpeta (o quitar de carpeta si folderId es null)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = moveAgentSchema.parse(body);

    // Verificar que el agente pertenece al usuario
    const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, validatedData.agentId);
    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: 'Agent not found or does not belong to your account' },
        { status: 404 }
      );
    }

    // Si se proporciona folderId, verificar que la carpeta pertenece al usuario
    if (validatedData.folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: validatedData.folderId,
          userId: user.id,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { success: false, error: 'Carpeta no encontrada' },
          { status: 404 }
        );
      }
    }

    // Actualizar el agente local con el folderId
    await prisma.agent.updateMany({
      where: {
        userId: user.id,
        retellAgentId: validatedData.agentId,
      },
      data: {
        folderId: validatedData.folderId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving agent:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to move agent' },
      { status: 500 }
    );
  }
}




