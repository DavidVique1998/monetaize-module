import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { RetellService } from '@/lib/retell';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/public/calls/[callId] - Obtener información de una llamada
 * Endpoint público que requiere autenticación mediante JWT
 * 
 * Solo permite obtener información de llamadas que pertenecen al usuario autenticado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> | { callId: string } }
) {
  try {
    // Extraer token del header Authorization
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token de autenticación requerido. Usa el header: Authorization: Bearer <token>' 
        },
        { status: 401 }
      );
    }

    // Verificar token JWT
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Obtener callId del path parameter
    const resolvedParams = await params;
    const callId = typeof resolvedParams.callId === 'string' 
      ? resolvedParams.callId 
      : String(resolvedParams.callId);

    if (!callId) {
      return NextResponse.json(
        { success: false, error: 'callId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la llamada pertenece al usuario (desde la base de datos local)
    const call = await prisma.call.findFirst({
      where: {
        retellCallId: callId,
        userId: payload.userId,
      },
    });

    if (!call) {
      // Si no está en la BD local, intentar obtenerla de Retell y verificar
      // que el agente pertenece al usuario
      try {
        const retellCall = await RetellService.getCall(callId);
        
        // Verificar que el agente de la llamada pertenece al usuario
        if (retellCall.agent_id) {
          const { RetellSyncService } = await import('@/lib/retell-sync');
          const agentExists = await RetellSyncService.verifyAgentOwnership(
            payload.userId,
            retellCall.agent_id
          );

          if (!agentExists) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Llamada no encontrada o no pertenece a tu cuenta' 
              },
              { status: 404 }
            );
          }
        }

        // Si la llamada existe en Retell y el agente pertenece al usuario, retornarla
        return NextResponse.json({
          success: true,
          data: retellCall,
        });
      } catch (retellError: any) {
        console.error('Error obteniendo llamada de Retell:', retellError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Llamada no encontrada o no pertenece a tu cuenta' 
          },
          { status: 404 }
        );
      }
    }

    // Si la llamada está en la BD local, obtener información actualizada de Retell
    try {
      const retellCall = await RetellService.getCall(callId);
      
      return NextResponse.json({
        success: true,
        data: {
          ...retellCall,
          // Incluir información adicional de la BD local si es necesario
          local_call_id: call.id,
          local_status: call.status,
        },
      });
    } catch (retellError: any) {
      console.error('Error obteniendo llamada de Retell:', retellError);
      
      // Si falla Retell, retornar información de la BD local
      return NextResponse.json({
        success: true,
        data: {
          call_id: call.retellCallId,
          call_status: call.status,
          call_type: call.callType,
          direction: call.direction,
          agent_id: call.agentId,
          agent_version: call.agentVersion,
          from_number: call.fromNumber,
          to_number: call.toNumber,
          duration: call.duration,
          start_timestamp: call.startTime ? call.startTime.getTime() : undefined,
          end_timestamp: call.endTime ? call.endTime.getTime() : undefined,
          recording_url: call.recordingUrl,
          transcript: call.transcript,
          cost: call.cost ? Number(call.cost) : undefined,
          tokens_used: call.tokensUsed,
          // Nota: Esta información puede estar desactualizada
          note: 'Información desde base de datos local. Puede estar desactualizada.',
        },
      });
    }

  } catch (error) {
    console.error('Error obteniendo llamada:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

