import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellService } from '@/lib/retell';
import { CallService } from '@/lib/call-service';

/**
 * POST /api/calls/[callId]/update
 * 
 * Obtiene los datos finales de Retell y crea/actualiza el registro en call history
 * Se llama cuando la llamada termina para capturar costos, tokens, duración, etc.
 */
export async function POST(
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

    const resolvedParams = await params;
    const callId = typeof resolvedParams.callId === 'string' 
      ? resolvedParams.callId 
      : String(resolvedParams.callId);

    // Obtener datos completos de Retell y guardar en BD
    // Esto creará o actualizará el registro con toda la información
    await RetellService.saveCallData(callId, user.id);

    // Obtener el registro actualizado para devolverlo
    const call = await CallService.getCallByRetellId(callId);

    if (!call) {
      return NextResponse.json(
        { success: false, error: 'Call not found after save' },
        { status: 404 }
      );
    }

    // Verificar ownership (por seguridad)
    if (call.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: call,
      message: 'Call data saved successfully with all information from Retell',
    });
  } catch (error: any) {
    console.error('Error saving call data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al guardar los datos de la llamada',
      },
      { status: 500 }
    );
  }
}

