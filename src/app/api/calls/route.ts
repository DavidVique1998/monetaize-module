import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { CallService } from '@/lib/call-service';

/**
 * GET /api/calls
 * 
 * Obtiene el historial de llamadas del usuario autenticado
 * 
 * Query params:
 * - agentId?: string - Filtrar por agente
 * - status?: string - Filtrar por estado
 * - callType?: 'phone' | 'web' - Filtrar por tipo de llamada
 * - direction?: 'inbound' | 'outbound' - Filtrar por dirección
 * - limit?: number - Límite de resultados (default: 50)
 * - offset?: number - Offset para paginación (default: 0)
 * - startDate?: string - Fecha de inicio (ISO string)
 * - endDate?: string - Fecha de fin (ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId') || undefined;
    const status = searchParams.get('status') || undefined;
    const callType = searchParams.get('callType') as 'phone' | 'web' | undefined;
    const direction = searchParams.get('direction') as 'inbound' | 'outbound' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const result = await CallService.getCallsForUser(user.id, {
      agentId,
      status,
      callType,
      direction,
      limit,
      offset,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener el historial de llamadas',
      },
      { status: 500 }
    );
  }
}

