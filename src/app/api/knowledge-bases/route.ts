/**
 * API Route para gestionar Knowledge Bases
 * GET: Listar todas las Knowledge Bases del usuario
 * POST: Crear una nueva Knowledge Base
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';

/**
 * GET /api/knowledge-bases
 * Listar todas las Knowledge Bases del usuario autenticado
 */
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

    // Obtener Knowledge Bases del usuario (solo las que pertenecen a su cuenta)
    const userKnowledgeBases = await RetellSyncService.getUserKnowledgeBases(user.id);
    
    return NextResponse.json({
      success: true,
      data: userKnowledgeBases,
    });
  } catch (error: any) {
    console.error('Error listing knowledge bases:', error);
    
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
        error: error.message || 'Error al listar Knowledge Bases',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-bases
 * Crear una nueva Knowledge Base para el usuario autenticado
 */
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

    const formData = await request.formData();
    
    const knowledge_base_name = formData.get('knowledge_base_name') as string;
    const enable_auto_refresh = formData.get('enable_auto_refresh') === 'true';
    
    if (!knowledge_base_name || knowledge_base_name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'knowledge_base_name es requerido',
        },
        { status: 400 }
      );
    }

    if (knowledge_base_name.length >= 40) {
      return NextResponse.json(
        {
          success: false,
          error: 'knowledge_base_name debe tener menos de 40 caracteres',
        },
        { status: 400 }
      );
    }

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

    // Procesar knowledge_base_urls (puede venir como array o como índices)
    const urls: string[] = [];
    const urlEntries = formData.getAll('knowledge_base_urls[]');
    if (urlEntries.length > 0) {
      urlEntries.forEach((url) => {
        if (typeof url === 'string' && url.trim().length > 0) {
          urls.push(url.trim());
        }
      });
    } else {
      // Fallback: intentar con formato indexado
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

    // Crear Knowledge Base en Retell y vincularla con el usuario
    const result = await RetellSyncService.createKnowledgeBaseForUser(user.id, {
      knowledge_base_name: knowledge_base_name.trim(),
      knowledge_base_texts,
      knowledge_base_urls,
      enable_auto_refresh,
    });

    return NextResponse.json({
      success: true,
      data: result.retellKnowledgeBase,
    });
  } catch (error: any) {
    console.error('Error creating knowledge base:', error);
    
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
        error: error.message || 'Error al crear Knowledge Base',
      },
      { status: 500 }
    );
  }
}

