/**
 * API Route para gestionar una Knowledge Base específica
 * GET: Obtener una Knowledge Base
 * DELETE: Eliminar una Knowledge Base
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import RetellService from '@/lib/retell';
import { RetellSyncService } from '@/lib/retell-sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/knowledge-bases/[knowledgeBaseId]
 * Obtener una Knowledge Base específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ knowledgeBaseId: string }> | { knowledgeBaseId: string } }
) {
  try {
    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const knowledgeBaseId = typeof resolvedParams.knowledgeBaseId === 'string' 
      ? resolvedParams.knowledgeBaseId 
      : String(resolvedParams.knowledgeBaseId);
    
    if (!knowledgeBaseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'knowledgeBaseId es requerido',
        },
        { status: 400 }
      );
    }

    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que la Knowledge Base pertenece al usuario
    const knowledgeBaseExists = await RetellSyncService.verifyKnowledgeBaseOwnership(
      user.id,
      knowledgeBaseId
    );
    
    if (!knowledgeBaseExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Knowledge Base not found or does not belong to your account',
        },
        { status: 404 }
      );
    }

    // Obtener la Knowledge Base de Retell
    const knowledgeBase = await RetellService.getKnowledgeBase(knowledgeBaseId);
    
    // Actualizar datos locales si es necesario
    await RetellSyncService.updateLocalKnowledgeBase(user.id, knowledgeBaseId, knowledgeBase);
    
    return NextResponse.json({
      success: true,
      data: knowledgeBase,
    });
  } catch (error: any) {
    console.error('Error getting knowledge base:', error);
    
    // Si es error de autenticación
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener Knowledge Base',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-bases/[knowledgeBaseId]
 * Eliminar una Knowledge Base
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ knowledgeBaseId: string }> | { knowledgeBaseId: string } }
) {
  try {
    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const knowledgeBaseId = typeof resolvedParams.knowledgeBaseId === 'string' 
      ? resolvedParams.knowledgeBaseId 
      : String(resolvedParams.knowledgeBaseId);
    
    if (!knowledgeBaseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'knowledgeBaseId es requerido',
        },
        { status: 400 }
      );
    }

    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que la Knowledge Base pertenece al usuario
    const knowledgeBaseExists = await RetellSyncService.verifyKnowledgeBaseOwnership(
      user.id,
      knowledgeBaseId
    );
    
    if (!knowledgeBaseExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Knowledge Base not found or does not belong to your account',
        },
        { status: 404 }
      );
    }

    // Eliminar de Retell
    await RetellService.deleteKnowledgeBase(knowledgeBaseId);
    
    // Eliminar de la base de datos local
    await prisma.knowledgeBase.deleteMany({
      where: {
        userId: user.id,
        retellKnowledgeBaseId: knowledgeBaseId,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Knowledge Base eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting knowledge base:', error);
    
    // Si es error de autenticación
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al eliminar Knowledge Base',
      },
      { status: 500 }
    );
  }
}

