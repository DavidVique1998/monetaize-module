import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellService } from '@/lib/retell';
import { RetellSyncService } from '@/lib/retell-sync';

/**
 * POST /api/calls/create
 * 
 * Crea una llamada telefónica outbound usando un agente específico de Retell
 * 
 * Body:
 * {
 *   agentId: string,        // ID del agente a usar (requerido)
 *   toNumber: string,       // Número de teléfono destino (requerido, formato E.164)
 *   fromNumber?: string,    // Número de teléfono origen (opcional)
 *   metadata?: object       // Metadatos adicionales para la llamada (opcional)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     call_id: string,
 *     agent_id: string,
 *     from_number: string,
 *     to_number: string,
 *     call_status: string,
 *     // ... otros campos de Retell
 *   }
 * }
 * 
 * Nota: Para agregar autenticación, puedes usar el middleware existente
 * o verificar la sesión usando SessionManager desde @/lib/session
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { agentId, toNumber, fromNumber, metadata } = body;

    // Validar parámetros requeridos
    if (!agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'agentId es requerido' 
        },
        { status: 400 }
      );
    }

    if (!toNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'toNumber es requerido' 
        },
        { status: 400 }
      );
    }

    // Validar formato de número telefónico (formato E.164 básico)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(toNumber)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'toNumber debe estar en formato E.164 (ej: +1234567890)' 
        },
        { status: 400 }
      );
    }

    if (fromNumber && !phoneRegex.test(fromNumber)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'fromNumber debe estar en formato E.164 (ej: +1234567890)' 
        },
        { status: 400 }
      );
    }

    // Verificar que el agente existe y pertenece al usuario
    try {
      const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, agentId);
      if (!agentExists) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Agente con ID ${agentId} no encontrado o no pertenece a tu cuenta` 
          },
          { status: 404 }
        );
      }
    } catch (error: any) {
      console.error('Error verificando agente:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al verificar agente: ${error.message || 'Agente no encontrado'}` 
        },
        { status: 404 }
      );
    }

    // Preparar datos para crear la llamada
    const callData: any = {
      to_number: toNumber,
      override_agent_id: agentId, // Especificar el agente a usar
    };

    // Agregar número origen si se proporciona
    if (fromNumber) {
      callData.from_number = fromNumber;
    }

    // Agregar metadatos si se proporcionan
    if (metadata) {
      callData.metadata = metadata;
    }

    console.log('Creando llamada con:', {
      agentId,
      toNumber,
      fromNumber: fromNumber || 'default',
      hasMetadata: !!metadata
    });

    // Crear la llamada usando Retell (con captura automática en BD)
    const callResponse = await RetellService.createCall(callData, user.id);

    console.log('Llamada creada exitosamente:', callResponse.call_id);

    return NextResponse.json({
      success: true,
      data: {
        // Incluir todos los campos de la respuesta de Retell primero
        ...callResponse,
        // Sobrescribir con valores específicos o calculados
        agent_id: agentId,
        from_number: fromNumber || callResponse.from_number,
        to_number: toNumber,
        call_status: callResponse.call_status || 'ringing',
        direction: 'outbound',
        created_at: new Date().toISOString(),
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creando llamada:', error);
    
    // Manejar errores específicos de Retell
    if (error.message?.includes('agent')) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Error con el agente: ${error.message}` 
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('phone number') || error.message?.includes('number')) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Error con el número telefónico: ${error.message}` 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al crear la llamada' 
      },
      { status: 500 }
    );
  }
}

