import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { RetellSyncService } from '@/lib/retell-sync';

/**
 * GET /api/public/agents - Listar agentes del usuario
 * Endpoint público que requiere autenticación mediante JWT
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   success: true,
 *   data: [
 *     {
 *       agent_id: string,
 *       agent_name: string,
 *       ...
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
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

    // Obtener agentes del usuario
    const userAgents = await RetellSyncService.getUserAgents(payload.userId);

    return NextResponse.json({
      success: true,
      data: userAgents
    });

  } catch (error) {
    console.error('Error listing agents:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error al listar agentes';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
