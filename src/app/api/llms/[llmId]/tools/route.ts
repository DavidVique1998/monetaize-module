import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellService } from '@/lib/retell';

/**
 * GET /api/llms/[llmId]/tools
 * 
 * Obtener todos los tools de un LLM
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

    // Obtener los tools del LLM
    const tools = await RetellService.getLLMTools(llmId);
    
    return NextResponse.json({ success: true, data: tools });
  } catch (error: any) {
    console.error('Error fetching LLM tools:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch LLM tools' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llms/[llmId]/tools
 * 
 * Agregar un nuevo tool a un LLM
 */
export async function POST(
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
    const { tool } = body;

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool data is required' },
        { status: 400 }
      );
    }

    // Validar estructura básica del tool
    if (!tool.type || !tool.name) {
      return NextResponse.json(
        { success: false, error: 'Tool must have type and name' },
        { status: 400 }
      );
    }

    // Agregar el tool al LLM
    const updatedLLM = await RetellService.addToolToLLM(llmId, tool);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        llm: updatedLLM,
        tools: (updatedLLM as any).general_tools || []
      }
    });
  } catch (error: any) {
    console.error('Error adding tool to LLM:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to add tool to LLM' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/llms/[llmId]/tools
 * 
 * Actualizar todos los tools de un LLM o un tool específico
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
    const { tools, toolIndex, tool } = body;

    // Si se proporciona un array de tools, reemplazar todos
    if (tools && Array.isArray(tools)) {
      const updatedLLM = await RetellService.replaceLLMTools(llmId, tools);
      return NextResponse.json({ 
        success: true, 
        data: {
          llm: updatedLLM,
          tools: (updatedLLM as any).general_tools || []
        }
      });
    }

    // Si se proporciona toolIndex y tool, actualizar un tool específico
    if (typeof toolIndex === 'number' && tool) {
      if (!tool.type || !tool.name) {
        return NextResponse.json(
          { success: false, error: 'Tool must have type and name' },
          { status: 400 }
        );
      }

      const updatedLLM = await RetellService.updateToolInLLM(llmId, toolIndex, tool);
      return NextResponse.json({ 
        success: true, 
        data: {
          llm: updatedLLM,
          tools: (updatedLLM as any).general_tools || []
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request body. Provide either "tools" array or "toolIndex" and "tool"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating LLM tools:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update LLM tools' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llms/[llmId]/tools
 * 
 * Eliminar un tool de un LLM
 */
export async function DELETE(
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

    // Obtener toolIndex de query params
    const { searchParams } = new URL(request.url);
    const toolIndexParam = searchParams.get('toolIndex');
    
    if (toolIndexParam === null) {
      return NextResponse.json(
        { success: false, error: 'toolIndex query parameter is required' },
        { status: 400 }
      );
    }

    const toolIndex = parseInt(toolIndexParam, 10);
    
    if (isNaN(toolIndex)) {
      return NextResponse.json(
        { success: false, error: 'toolIndex must be a valid number' },
        { status: 400 }
      );
    }

    // Eliminar el tool
    const updatedLLM = await RetellService.removeToolFromLLM(llmId, toolIndex);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        llm: updatedLLM,
        tools: (updatedLLM as any).general_tools || []
      }
    });
  } catch (error: any) {
    console.error('Error removing tool from LLM:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to remove tool from LLM' 
      },
      { status: 500 }
    );
  }
}


