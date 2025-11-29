import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';
import { CallService } from '@/lib/call-service';

/**
 * POST /api/webhooks/retell
 * 
 * Webhook para recibir eventos de Retell AI
 * Eventos soportados:
 * - call_ended: Cuando una llamada termina
 * - call_analyzed: Cuando se completa el análisis de la llamada
 * 
 * Según la documentación de Retell:
 * https://docs.retellai.com/api-references/create-web-call
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, call_id, ...payload } = body;

    console.log(`[Retell Webhook] Evento recibido: ${event} para call_id: ${call_id}`);

    if (!call_id) {
      console.warn('[Retell Webhook] call_id no proporcionado');
      return NextResponse.json(
        { success: false, error: 'call_id is required' },
        { status: 400 }
      );
    }

    switch (event) {
      case 'call_ended':
      case 'call_analyzed':
        // Cuando la llamada termina o se analiza, obtener datos completos de Retell y guardarlos
        try {
          // Obtener userId desde el payload o desde la llamada existente
          let userId: string | undefined;
          try {
            const { CallService } = await import('@/lib/call-service');
            const existingCall = await CallService.getCallByRetellId(call_id);
            userId = existingCall?.userId || undefined;
          } catch (e) {
            console.warn(`[Retell Webhook] No se pudo obtener userId para call ${call_id}`);
          }

          // Guardar datos completos de la llamada
          await RetellService.saveCallData(call_id, userId);
          console.log(`[Retell Webhook] Call ${call_id} guardada exitosamente con todos los datos`);
        } catch (error: any) {
          console.error(`[Retell Webhook] Error guardando call ${call_id}:`, error);
          // No fallar el webhook, solo loguear
        }
        break;

      case 'call_started':
        // Actualizar estado a "ongoing"
        try {
          const existingCall = await CallService.getCallByRetellId(call_id);
          if (existingCall) {
            await CallService.updateCall(call_id, {
              status: 'ongoing',
            });
            console.log(`[Retell Webhook] Call ${call_id} marcada como ongoing`);
          }
        } catch (error: any) {
          console.error(`[Retell Webhook] Error actualizando estado de call ${call_id}:`, error);
        }
        break;

      default:
        console.log(`[Retell Webhook] Evento no manejado: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Retell Webhook] Error procesando webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al procesar webhook',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/retell
 * 
 * Endpoint para verificar que el webhook está activo
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Retell webhook endpoint is active',
    supportedEvents: ['call_started', 'call_ended', 'call_analyzed'],
  });
}

