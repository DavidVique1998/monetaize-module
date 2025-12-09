import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';
import { CallService } from '@/lib/call-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/agents/[agentId]/stats
 * 
 * Obtiene estadísticas del agente basadas en llamadas reales:
 * - Costo promedio por minuto
 * - Latencia promedio
 * - Tokens promedio consumidos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> | { agentId: string } }
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
    const agentId = typeof resolvedParams.agentId === 'string' 
      ? resolvedParams.agentId 
      : String(resolvedParams.agentId);

    // Verificar que el agente pertenece al usuario
    const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, agentId);
    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: 'Agent not found or does not belong to your account' },
        { status: 404 }
      );
    }

    // Obtener todas las llamadas completadas del agente
    const callsResult = await CallService.getCallsForUser(user.id, {
      agentId,
      status: 'ended',
      limit: 1000, // Obtener hasta 1000 llamadas para calcular estadísticas
    });

    const calls = callsResult.calls;

    if (calls.length === 0) {
      // Si no hay llamadas, retornar valores por defecto
      return NextResponse.json({
        success: true,
        data: {
          costPerMinute: null,
          latency: null,
          tokens: null,
          totalCalls: 0,
          message: 'No hay llamadas completadas para este agente',
        },
      });
    }

    // Extraer información de costos, duración y tokens de las llamadas
    // Según la documentación de Retell: https://docs.retellai.com/api-references/create-web-call
    let totalCost = 0;
    let totalDuration = 0; // en segundos (usar totalDurationSeconds si está disponible)
    let totalTokens = 0;
    let totalLatency = 0;
    let callsWithCost = 0;
    let callsWithTokens = 0;
    let callsWithLatency = 0;

    for (const call of calls) {
      // Costo desde call.cost (que viene de call_cost.combined_cost)
      // call.cost es Decimal, necesitamos convertirlo a número
      if (call.cost) {
        const costValue = Number(call.cost);
        if (costValue > 0) {
          totalCost += costValue;
        callsWithCost++;
        }
      }

      // Duración: preferir totalDurationSeconds, sino usar duration
      const callDuration = call.totalDurationSeconds || call.duration;
      if (callDuration && callDuration > 0) {
        totalDuration += callDuration;
      }

      // Tokens: primero desde call.tokensUsed, sino desde retellMetadata
      if (call.tokensUsed && call.tokensUsed > 0) {
        totalTokens += call.tokensUsed;
        callsWithTokens++;
      } else if (call.retellMetadata) {
        const metadata = call.retellMetadata as any;
        
        // Tokens desde llm_token_usage según la documentación de Retell
        if (metadata.llm_token_usage) {
          if (metadata.llm_token_usage.average !== undefined) {
            totalTokens += metadata.llm_token_usage.average;
            callsWithTokens++;
          } else if (Array.isArray(metadata.llm_token_usage.values) && metadata.llm_token_usage.values.length > 0) {
            const tokensSum = metadata.llm_token_usage.values.reduce((sum: number, val: number) => sum + val, 0);
            totalTokens += tokensSum;
            callsWithTokens++;
          }
        } else if (metadata.tokens_used) {
          totalTokens += metadata.tokens_used;
          callsWithTokens++;
        } else if (metadata.llm_usage?.total_tokens) {
          totalTokens += metadata.llm_usage.total_tokens;
          callsWithTokens++;
        } else if (metadata.usage?.total_tokens) {
          totalTokens += metadata.usage.total_tokens;
          callsWithTokens++;
        }
      }

      // Latencia desde retellMetadata.latency
      if (call.retellMetadata) {
        const metadata = call.retellMetadata as any;
        
        // Latencia según la documentación de Retell (latency.e2e.p50, etc.)
        if (metadata.latency?.e2e?.p50) {
          totalLatency += metadata.latency.e2e.p50;
          callsWithLatency++;
        } else if (metadata.latency?.llm?.p50) {
          totalLatency += metadata.latency.llm.p50;
          callsWithLatency++;
        } else if (metadata.average_latency_ms) {
          totalLatency += metadata.average_latency_ms;
          callsWithLatency++;
        } else if (metadata.latency_ms) {
          totalLatency += metadata.latency_ms;
          callsWithLatency++;
        } else if (metadata.response_time_ms) {
          totalLatency += metadata.response_time_ms;
          callsWithLatency++;
        }
      }
    }

    // Calcular costo por minuto usando totalDurationSeconds (duración oficial de Retell)
    // Según la documentación: call_cost.combined_cost / (call_cost.total_duration_seconds / 60)
    const costPerMinute = callsWithCost > 0 && totalDuration > 0
      ? (totalCost / (totalDuration / 60)).toFixed(3)
      : null;

    const averageLatency = callsWithLatency > 0
      ? Math.round(totalLatency / callsWithLatency)
      : null;

    const averageTokens = callsWithTokens > 0
      ? Math.round(totalTokens / callsWithTokens)
      : null;

    // Calcular rangos si hay suficientes datos
    let latencyRange = null;
    let tokensRange = null;

    if (callsWithLatency > 1) {
      const latencies: number[] = [];
      calls.forEach(call => {
        if (call.retellMetadata) {
          const metadata = call.retellMetadata as any;
          const latency = metadata.average_latency_ms || metadata.latency_ms || metadata.response_time_ms;
          if (latency) latencies.push(latency);
        }
      });
      if (latencies.length > 0) {
        latencies.sort((a, b) => a - b);
        const min = latencies[0];
        const max = latencies[latencies.length - 1];
        latencyRange = `${min}-${max}ms`;
      }
    }

    if (callsWithTokens > 1) {
      const tokens: number[] = [];
      calls.forEach(call => {
        // Preferir tokensUsed del modelo, sino buscar en metadata
        if (call.tokensUsed) {
          tokens.push(call.tokensUsed);
        } else if (call.retellMetadata) {
          const metadata = call.retellMetadata as any;
          let tokenCount: number | undefined;
          
          if (metadata.llm_token_usage) {
            if (metadata.llm_token_usage.average !== undefined) {
              tokenCount = metadata.llm_token_usage.average;
            } else if (Array.isArray(metadata.llm_token_usage.values) && metadata.llm_token_usage.values.length > 0) {
              tokenCount = metadata.llm_token_usage.values.reduce((sum: number, val: number) => sum + val, 0);
            }
          } else {
            tokenCount = metadata.tokens_used || metadata.llm_usage?.total_tokens || metadata.usage?.total_tokens;
          }
          
          if (tokenCount) tokens.push(tokenCount);
        }
      });
      if (tokens.length > 0) {
        tokens.sort((a, b) => a - b);
        const min = tokens[0];
        const max = tokens[tokens.length - 1];
        tokensRange = `${min}-${max} tokens`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        costPerMinute: costPerMinute ? `$${costPerMinute}/min` : null,
        latency: latencyRange || (averageLatency ? `${averageLatency}ms` : null),
        tokens: tokensRange || (averageTokens ? `${averageTokens} tokens` : null),
        totalCalls: calls.length,
        averageCost: callsWithCost > 0 ? (totalCost / callsWithCost).toFixed(4) : null,
        averageDuration: totalDuration > 0 ? Math.round(totalDuration / calls.length) : null,
        averageTokens: averageTokens,
        averageLatency: averageLatency,
      },
    });
  } catch (error: any) {
    console.error('Error fetching agent stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener estadísticas del agente',
      },
      { status: 500 }
    );
  }
}

