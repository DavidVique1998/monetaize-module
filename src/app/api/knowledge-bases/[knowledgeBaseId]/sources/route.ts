/**
 * API Route para gestionar fuentes de Knowledge Base
 * POST: Agregar fuentes a una Knowledge Base
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import RetellService from '@/lib/retell';
import { RetellSyncService } from '@/lib/retell-sync';

/**
 * POST /api/knowledge-bases/[knowledgeBaseId]/sources
 * Agregar fuentes a una Knowledge Base
 */
export async function POST(
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

    const formData = await request.formData();

    // Procesar knowledge_base_texts
    const textsJson = formData.get('knowledge_base_texts') as string | null;
    let knowledge_base_texts: Array<{ text: string; title?: string }> | undefined;
    if (textsJson) {
      try {
        knowledge_base_texts = JSON.parse(textsJson);
      } catch (e) {
        console.warn('Error parsing knowledge_base_texts:', e);
      }
    }

    // Procesar knowledge_base_urls
    const urls: string[] = [];
    const urlEntries = formData.getAll('knowledge_base_urls[]');
    if (urlEntries.length > 0) {
      urlEntries.forEach((url) => {
        if (typeof url === 'string' && url.trim().length > 0) {
          urls.push(url.trim());
        }
      });
    } else {
      let urlIndex = 0;
      while (formData.get(`knowledge_base_urls[${urlIndex}]`)) {
        const url = formData.get(`knowledge_base_urls[${urlIndex}]`) as string;
        if (url && url.trim().length > 0) {
          urls.push(url.trim());
        }
        urlIndex++;
      }
    }
    const knowledge_base_urls = urls.length > 0 ? urls : undefined;

    if (!knowledge_base_texts && !knowledge_base_urls) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debe proporcionar al menos una fuente (texts o urls)',
        },
        { status: 400 }
      );
    }

    const result = await RetellService.addKnowledgeBaseSources(knowledgeBaseId, {
      knowledge_base_texts,
      knowledge_base_urls,
    });

    // Actualizar datos locales si es necesario
    const updatedKnowledgeBase = await RetellService.getKnowledgeBase(knowledgeBaseId);
    await RetellSyncService.updateLocalKnowledgeBase(user.id, knowledgeBaseId, updatedKnowledgeBase);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error adding knowledge base sources:', error);
    
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
        error: error.message || 'Error al agregar fuentes a Knowledge Base',
      },
      { status: 500 }
    );
  }
}

