import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { CallService } from '@/lib/call-service';

/**
 * GET /api/calls/stats
 * 
 * Obtiene estadísticas de llamadas del usuario autenticado
 * 
 * Query params:
 * - agentId?: string - Filtrar por agente
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
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const stats = await CallService.getCallStats(user.id, {
      agentId,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching call stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener estadísticas de llamadas',
      },
      { status: 500 }
    );
  }
}

