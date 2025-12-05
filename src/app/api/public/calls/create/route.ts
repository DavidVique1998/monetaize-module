import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { RetellService } from '@/lib/retell';
import { RetellSyncService } from '@/lib/retell-sync';
import { z } from 'zod';

const createCallSchema = z.object({
  // ID del agente a usar (requerido)
  agent_id: z.string().min(1, 'agent_id es requerido'),
  // Número de teléfono destino (requerido, formato E.164)
  to_number: z.string().regex(/^\+[1-9]\d{1,14}$/, 'to_number debe estar en formato E.164 (ej: +1234567890)'),
  // Número de teléfono origen (opcional, formato E.164)
  from_number: z.string().regex(/^\+[1-9]\d{1,14}$/, 'from_number debe estar en formato E.164').optional(),
  // Versión del agente (opcional)
  agent_version: z.number().int().positive().optional(),
  // Variables dinámicas para el LLM (opcional)
  retell_llm_dynamic_variables: z.record(z.string(), z.string()).optional(),
  // Metadatos adicionales (opcional)
  metadata: z.record(z.string(), z.any()).optional(),
  // Headers SIP personalizados (opcional)
  custom_sip_headers: z.record(z.string(), z.string()).optional(),
});

/**
 * POST /api/public/calls/create - Crear una llamada telefónica
 * Endpoint público que requiere autenticación mediante JWT
 * 
 * Body:
 * {
 *   agent_id: string (requerido),
 *   to_number: string (requerido, formato E.164),
 *   from_number?: string (opcional, formato E.164),
 *   agent_version?: number (opcional),
 *   retell_llm_dynamic_variables?: object (opcional),
 *   metadata?: object (opcional),
 *   custom_sip_headers?: object (opcional)
 * }
 */
export async function POST(request: NextRequest) {
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

    // Validar datos del request
    const body = await request.json();
    const validatedData = createCallSchema.parse(body);

    // Verificar que el agente existe y pertenece al usuario
    const agentExists = await RetellSyncService.verifyAgentOwnership(
      payload.userId,
      validatedData.agent_id
    );

    if (!agentExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Agente con ID ${validatedData.agent_id} no encontrado o no pertenece a tu cuenta` 
        },
        { status: 404 }
      );
    }

    // Preparar datos para crear la llamada en Retell
    const callData: any = {
      to_number: validatedData.to_number,
      override_agent_id: validatedData.agent_id,
    };

    // Agregar número origen si se proporciona
    if (validatedData.from_number) {
      callData.from_number = validatedData.from_number;
    }

    // Agregar versión del agente si se proporciona
    if (validatedData.agent_version) {
      callData.override_agent_version = validatedData.agent_version;
    }

    // Agregar variables dinámicas si se proporcionan
    if (validatedData.retell_llm_dynamic_variables) {
      callData.retell_llm_dynamic_variables = validatedData.retell_llm_dynamic_variables;
    }

    // Agregar metadatos si se proporcionan
    if (validatedData.metadata) {
      callData.metadata = validatedData.metadata;
    }

    // Agregar headers SIP personalizados si se proporcionan
    if (validatedData.custom_sip_headers) {
      callData.custom_sip_headers = validatedData.custom_sip_headers;
    }

    console.log('Creando llamada con:', {
      agentId: validatedData.agent_id,
      toNumber: validatedData.to_number,
      fromNumber: validatedData.from_number || 'default',
      userId: payload.userId,
    });

    // Crear la llamada usando Retell
    const callResponse = await RetellService.createCall(callData, payload.userId);

    console.log('Llamada creada exitosamente:', callResponse.call_id);

    return NextResponse.json({
      success: true,
      data: {
        // Incluir todos los campos de la respuesta de Retell primero
        ...callResponse,
        // Sobrescribir con valores específicos o calculados
        direction: callResponse.direction || 'outbound',
        created_at: new Date().toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando llamada:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Manejar errores específicos de Retell
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('agent')) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Error con el agente: ${errorMessage}` 
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes('phone number') || errorMessage.includes('number')) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Error con el número telefónico: ${errorMessage}` 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage || 'Error al crear la llamada' 
      },
      { status: 500 }
    );
  }
}

