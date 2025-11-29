import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellService } from '@/lib/retell';

/**
 * GET /api/llms/[llmId]
 * 
 * Obtener un LLM específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ llmId: string }> | { llmId: string } }
) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const llmId = decodeURIComponent(
      typeof resolvedParams.llmId === 'string' 
        ? resolvedParams.llmId 
        : String(resolvedParams.llmId)
    );

    // Obtener el LLM
    const llm = await RetellService.getRetellLlm(llmId);
    
    return NextResponse.json({ success: true, data: llm });
  } catch (error: any) {
    console.error('Error fetching LLM:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch LLM' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/llms/[llmId]
 * 
 * Actualizar un LLM
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ llmId: string }> | { llmId: string } }
) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const llmId = decodeURIComponent(
      typeof resolvedParams.llmId === 'string' 
        ? resolvedParams.llmId 
        : String(resolvedParams.llmId)
    );

    const body = await request.json();

    // Actualizar el LLM usando RetellService
    const llm = await RetellService.updateRetellLLM(llmId, body);
    
    return NextResponse.json({ success: true, data: llm });
  } catch (error: any) {
    console.error('Error updating LLM:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update LLM' 
      },
      { status: 500 }
    );
  }
}

