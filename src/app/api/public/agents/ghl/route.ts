import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { RetellSyncService } from '@/lib/retell-sync';

/**
 * POST /api/public/agents/ghl - Listar agentes en formato GHL (GoHighLevel)
 * Endpoint público que requiere autenticación mediante JWT
 * 
 * Headers:
 *   Authorization: Bearer <token>
 *   Content-Type: application/json
 * 
 * Body (opcional):
 * {
 *   "locationId": "string (opcional)"  // Filtrar por location ID
 * }
 * 
 * Response (formato GHL):
 * {
 *   "inputs": [
 *     {
 *       "section": "Personal Info",
 *       "fields": [{
 *         "field": "agent_id",
 *         "title": "Agente",
 *         "fieldType": "select",
 *         "required": true,
 *         "options": [
 *           {
 *             "label": "Nombre del agente",
 *             "value": "id del agente"
 *           }
 *         ]
 *       }]
 *     }
 *   ]
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

    // Obtener agentes del usuario
    const userAgents = await RetellSyncService.getUserAgents(payload.userId);

    // Transformar agentes al formato GHL
    // Si no hay agentes, retornar estructura vacía pero válida
    const ghlFormat = {
      inputs: [
        {
          section: "Personal Info",
          fields: [
            {
              field: "agent_id",
              title: "Agente",
              fieldType: "select",
              required: true,
              options: userAgents.length > 0
                ? userAgents.map(agent => ({
                    label: agent.agent_name || `Agente ${agent.agent_id.substring(0, 8)}`,
                    value: agent.agent_id
                  }))
                : []
            }
          ]
        }
      ]
    };

    return NextResponse.json(ghlFormat);

  } catch (error) {
    console.error('Error listing agents in GHL format:', error);
    
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
