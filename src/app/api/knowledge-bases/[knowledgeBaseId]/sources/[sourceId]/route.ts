/**
 * API Route para eliminar una fuente específica de Knowledge Base
 * DELETE: Eliminar una fuente de Knowledge Base
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import RetellService from '@/lib/retell';
import { RetellSyncService } from '@/lib/retell-sync';

/**
 * DELETE /api/knowledge-bases/[knowledgeBaseId]/sources/[sourceId]
 * Eliminar una fuente de Knowledge Base
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ knowledgeBaseId: string; sourceId: string }> | { knowledgeBaseId: string; sourceId: string } }
) {
  try {
    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const knowledgeBaseId = typeof resolvedParams.knowledgeBaseId === 'string' 
      ? resolvedParams.knowledgeBaseId 
      : String(resolvedParams.knowledgeBaseId);
    const sourceId = typeof resolvedParams.sourceId === 'string' 
      ? resolvedParams.sourceId 
      : String(resolvedParams.sourceId);
    
    if (!knowledgeBaseId || !sourceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'knowledgeBaseId y sourceId son requeridos',
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

    await RetellService.deleteKnowledgeBaseSource(knowledgeBaseId, sourceId);
    
    // Actualizar datos locales si es necesario
    const updatedKnowledgeBase = await RetellService.getKnowledgeBase(knowledgeBaseId);
    await RetellSyncService.updateLocalKnowledgeBase(user.id, knowledgeBaseId, updatedKnowledgeBase);
    
    return NextResponse.json({
      success: true,
      message: 'Fuente eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting knowledge base source:', error);
    
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
        error: error.message || 'Error al eliminar fuente de Knowledge Base',
      },
      { status: 500 }
    );
  }
}

