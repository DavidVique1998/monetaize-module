import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { CallService } from '@/lib/call-service';
import { RetellService } from '@/lib/retell';

/**
 * GET /api/calls/[callId]
 * 
 * Obtiene detalles de una llamada específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> | { callId: string } }
) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const callId = typeof resolvedParams.callId === 'string' 
      ? resolvedParams.callId 
      : String(resolvedParams.callId);

    // Obtener de la base de datos local
    const call = await CallService.getCallByRetellId(callId);

    if (!call) {
      return NextResponse.json(
        { success: false, error: 'Call not found' },
        { status: 404 }
      );
    }

    // Verificar que la llamada pertenece al usuario
    if (call.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Obtener información actualizada de Retell
    try {
      const retellCall = await RetellService.getCall(callId);
      return NextResponse.json({
        success: true,
        data: {
          ...call,
          retellData: retellCall,
        },
      });
    } catch (retellError) {
      // Si falla Retell, devolver solo los datos locales
      console.warn('Could not fetch call from Retell:', retellError);
      return NextResponse.json({
        success: true,
        data: call,
      });
    }
  } catch (error: any) {
    console.error('Error fetching call:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener la llamada',
      },
      { status: 500 }
    );
  }
}

