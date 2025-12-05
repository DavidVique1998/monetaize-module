import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';
import { RetellService } from '@/lib/retell';
import { ImportPhoneNumberData } from '@/lib/retell';

/**
 * POST /api/phone-numbers/create
 * 
 * Crea o importa un número telefónico en Retell según la documentación:
 * https://docs.retellai.com/api-references/create-phone-number
 * 
 * Body para CREAR número (comprar nuevo):
 * {
 *   area_code: number,              // Código de área de 3 dígitos (requerido para crear)
 *   phone_number?: string,          // Número específico en E.164 (opcional)
 *   inbound_agent_id?: string,      // ID del agente para llamadas entrantes
 *   outbound_agent_id?: string,     // ID del agente para llamadas salientes
 *   inbound_agent_version?: number, // Versión del agente entrante
 *   outbound_agent_version?: number,// Versión del agente saliente
 *   nickname?: string,              // Nombre descriptivo
 *   inbound_webhook_url?: string,   // Webhook para llamadas entrantes
 *   number_provider?: 'twilio' | 'telnyx', // Proveedor (default: twilio)
 *   country_code?: 'US' | 'CA',     // Código de país (default: US)
 *   toll_free?: boolean,            // Número gratuito (default: false)
 * }
 * 
 * Body para IMPORTAR número existente:
 * {
 *   phone_number: string,           // Número en formato E.164 (requerido)
 *   termination_uri?: string,       // URI de terminación SIP
 *   sip_trunk_auth_username?: string,
 *   sip_trunk_auth_password?: string,
 *   inbound_agent_id?: string,
 *   outbound_agent_id?: string,
 *   // ... otros campos
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     phone_number: string,
 *     phone_number_pretty: string,
 *     phone_number_type: string,
 *     inbound_agent_id: string,
 *     outbound_agent_id: string,
 *     // ... otros campos de Retell
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  let phoneNumber: string | undefined;
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
    phoneNumber = body.phone_number;
    const {
      // Tipo de operación
      operation_type,
      
      // Campos para crear número (comprar nuevo)
      area_code,
      phone_number,
      number_provider = 'twilio',
      country_code = 'US',
      toll_free = false,
      
      // Campos para agentes
      inbound_agent_id,
      outbound_agent_id,
      inbound_agent_version,
      outbound_agent_version,
      
      // Campos opcionales
      nickname,
      inbound_webhook_url,
      
      // Campos para importar número existente (según documentación Retell AI)
      termination_uri,
      sip_trunk_auth_username,
      sip_trunk_auth_password,
    } = body;

    // Determinar si es crear o importar
    // Prioridad: operation_type > (area_code para crear) > (phone_number sin area_code para importar)
    const isCreating = operation_type === 'create' || (!!area_code && operation_type !== 'import');
    const isImporting = operation_type === 'import' || (!!phone_number && !area_code && !operation_type);

    // Validar que se proporcione al menos uno de los métodos
    if (!isCreating && !isImporting) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Se requiere area_code para crear un número nuevo, o phone_number para importar un número existente' 
        },
        { status: 400 }
      );
    }

    // Validaciones para crear número
    if (isCreating) {
      if (typeof area_code !== 'number' || area_code < 100 || area_code > 999) {
      return NextResponse.json(
        { 
          success: false, 
            error: 'area_code debe ser un número de 3 dígitos (100-999)' 
        },
        { status: 400 }
      );
    }

      // Si se proporciona phone_number, validar formato E.164
      if (phone_number) {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone_number)) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'phone_number debe estar en formato E.164 (ej: +14157774444)' 
            },
            { status: 400 }
          );
        }
      }
    }

    // Validaciones para importar número (según documentación Retell AI)
    if (isImporting) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phone_number || !phoneRegex.test(phone_number)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'phone_number es requerido y debe estar en formato E.164 (ej: +14157774444)' 
          },
          { status: 400 }
        );
      }
      
      // termination_uri es requerido según documentación Retell AI
      if (!termination_uri) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'termination_uri es requerido para importar un número. Debe ser la URI de terminación SIP (ej: someuri.pstn.twilio.com)' 
          },
          { status: 400 }
        );
      }
    }

    // Verificar que los agentes existen y pertenecen al usuario
    if (inbound_agent_id) {
    try {
        const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, inbound_agent_id);
      if (!agentExists) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Agente entrante con ID ${inbound_agent_id} no encontrado o no pertenece a tu cuenta` 
            },
            { status: 404 }
          );
        }
      } catch (error: any) {
        console.error('Error verificando agente entrante:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: `Error al verificar agente entrante: ${error.message || 'Agente no encontrado'}` 
          },
          { status: 404 }
        );
      }
    }

    if (outbound_agent_id) {
      try {
        const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, outbound_agent_id);
        if (!agentExists) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Agente saliente con ID ${outbound_agent_id} no encontrado o no pertenece a tu cuenta` 
          },
          { status: 404 }
        );
      }
    } catch (error: any) {
        console.error('Error verificando agente saliente:', error);
      return NextResponse.json(
        { 
          success: false, 
            error: `Error al verificar agente saliente: ${error.message || 'Agente no encontrado'}` 
        },
        { status: 404 }
      );
    }
    }

    // Preparar datos según el tipo de operación
    let phoneData: any;
    
    if (isCreating) {
      // Datos para crear número nuevo
      phoneData = {
        area_code,
        ...(phone_number && { phone_number }),
        ...(inbound_agent_id && { inbound_agent_id }),
        ...(outbound_agent_id && { outbound_agent_id }),
        ...(inbound_agent_version && { inbound_agent_version }),
        ...(outbound_agent_version && { outbound_agent_version }),
        ...(nickname && { nickname }),
        ...(inbound_webhook_url && { inbound_webhook_url }),
        number_provider,
        country_code,
        toll_free,
      };
    } else {
      // Datos para importar número existente
      phoneData = {
        phone_number,
        ...(inbound_agent_id && { inbound_agent_id }),
        ...(outbound_agent_id && { outbound_agent_id }),
        ...(inbound_agent_version && { inbound_agent_version }),
        ...(outbound_agent_version && { outbound_agent_version }),
      ...(nickname && { nickname }),
        ...(inbound_webhook_url && { inbound_webhook_url }),
      ...(termination_uri && { termination_uri }),
      ...(sip_trunk_auth_username && { sip_trunk_auth_username }),
      ...(sip_trunk_auth_password && { sip_trunk_auth_password }),
    };
    }

    console.log(`${isCreating ? 'Creando' : 'Importando'} número telefónico para usuario:`, {
      userId: user.id,
      userEmail: user.email,
      ghlLocationId: user.ghlLocationId,
      operation: isCreating ? 'create' : 'import',
      phoneData
    });

    // Crear/importar número en Retell y vincularlo con el usuario
    const { retellPhone, localPhone } = await RetellSyncService.createPhoneNumberForUser(
      user.id,
      phoneData,
      isCreating
    );

    console.log('Número creado/importado exitosamente:', retellPhone.phone_number);

    return NextResponse.json({
      success: true,
      data: {
        // Incluir todos los campos de la respuesta de Retell primero
        ...retellPhone,
        // Campos adicionales calculados
        created_at: new Date().toISOString(),
      },
      localPhone: localPhone
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creando/importando número:', error);
    
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

    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { 
          success: false, 
          error: `El número ${phoneNumber || 'desconocido'} ya está registrado en Retell` 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al crear/importar el número telefónico' 
      },
      { status: 500 }
    );
  }
}

