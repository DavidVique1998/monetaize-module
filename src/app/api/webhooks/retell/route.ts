import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';
import { CallService } from '@/lib/call-service';
import { PrismaClient } from '@prisma/client';
import { getOrCreateWallet, consumeCredits } from '@/lib/wallet';
import { config } from '@/lib/config';

const prisma = new PrismaClient();

/**
 * POST /api/webhooks/retell
 * 
 * Webhook para recibir eventos de Retell AI
 * Eventos soportados:
 * - call_ended: Cuando una llamada termina
 * - call_analyzed: Cuando se completa el análisis de la llamada
 * 
 * Flujo:
 * 1. Obtener call_id del webhook
 * 2. Obtener datos completos de la llamada desde Retell (incluyendo agent_id y costo)
 * 3. Buscar agente en BD local usando retellAgentId = agent_id
 * 4. Obtener userId del propietario del agente
 * 5. Obtener wallet del usuario
 * 6. Cargar el costo de la llamada a la wallet del usuario
 * 7. Guardar/actualizar la llamada en BD con el userId
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
        // Cuando la llamada termina o se analiza, procesar el cargo a la wallet
        try {
          // 1. Obtener datos completos de la llamada desde Retell
          const retellCall = await RetellService.getCall(call_id);
          const callData = retellCall as any;
          const agentId = callData?.agent_id;

          if (!agentId) {
            console.warn(`[Retell Webhook] No se pudo obtener agent_id de la llamada ${call_id}`);
            return NextResponse.json(
              { success: false, error: 'agent_id not found in call data' },
              { status: 400 }
            );
          }

          // 2. Buscar agente en BD local para obtener el userId del propietario
          const agent = await prisma.agent.findFirst({
            where: {
              retellAgentId: agentId,
            },
            select: {
              userId: true,
            },
          });

          if (!agent || !agent.userId) {
            console.warn(`[Retell Webhook] Agente ${agentId} no encontrado en BD local o no tiene userId`);
            return NextResponse.json(
              { success: false, error: `Agent ${agentId} not found or has no owner` },
              { status: 404 }
            );
          }

          const userId = agent.userId;
          console.log(`[Retell Webhook] Usuario identificado: ${userId} para agente ${agentId}`);

          // 3. Extraer costo de la llamada desde Retell
          let cost: number | undefined;
          if (callData.call_cost?.combined_cost !== undefined) {
            cost = callData.call_cost.combined_cost; // Ya viene en centavos
          } else if (callData.call_cost) {
            cost = typeof callData.call_cost === 'number' ? callData.call_cost : undefined;
          } else if (callData.cost) {
            cost = callData.cost;
          }

          // Calcular costo con margen (beneficio) en centavos
          const baseCostCents = Math.round(cost ?? 0);
          const profitPercent = config.pricing?.callProfitPercent ?? 0;
          const finalCostCents = Math.round(baseCostCents * (1 + (profitPercent / 100)));

          // 4. Verificar si la llamada ya fue procesada (evitar doble cargo)
          const existingCall = await CallService.getCallByRetellId(call_id);
          const alreadyCharged = existingCall && existingCall.cost !== null && Number(existingCall.cost) > 0;

          // 5. Cargar a la wallet solo si hay costo y no se ha cargado antes
          if (finalCostCents > 0 && !alreadyCharged) {
            try {
              const wallet = await getOrCreateWallet(userId);

              // Extraer duración para la métrica
              let duration: number | undefined;
              if (callData.start_timestamp && callData.end_timestamp) {
                duration = Math.floor((callData.end_timestamp - callData.start_timestamp) / 1000);
              } else if (callData.call_cost?.total_duration_seconds) {
                duration = callData.call_cost.total_duration_seconds;
              } else if (callData.duration_ms) {
                duration = Math.floor(callData.duration_ms / 1000);
              }

              // Pasar amount directamente en centavos (sin conversión)
              const chargeResult = await consumeCredits({
                walletId: wallet.id,
                amount: finalCostCents, // Ya está en centavos
                metricType: 'call',
                metricValue: duration,
                description: `Llamada ${call_id}`,
                conversationId: call_id,
              });

              if (chargeResult.success) {
                console.log(`[Retell Webhook] Cargo exitoso a wallet ${wallet.id}: ${finalCostCents} centavos ($${(finalCostCents / 100).toFixed(2)})`);
              } else {
                console.error(`[Retell Webhook] Error cargando a wallet: ${chargeResult.error}`);
                // Continuar guardando la llamada aunque falle el cargo
              }
            } catch (walletError: any) {
              console.error(`[Retell Webhook] Error procesando cargo a wallet para call ${call_id}:`, walletError);
              // Continuar guardando la llamada aunque falle el cargo
            }
          } else if (alreadyCharged) {
            console.log(`[Retell Webhook] Llamada ${call_id} ya fue cargada anteriormente, omitiendo cargo`);
          } else if (finalCostCents === 0) {
            console.log(`[Retell Webhook] Llamada ${call_id} no tiene costo, omitiendo cargo`);
          }

          // 6. Guardar/actualizar datos completos de la llamada en BD
          await RetellService.saveCallData(call_id, userId);
          console.log(`[Retell Webhook] Call ${call_id} guardada exitosamente con userId: ${userId}`);
        } catch (error: any) {
          console.error(`[Retell Webhook] Error procesando call ${call_id}:`, error);
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
  } finally {
    await prisma.$disconnect();
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
