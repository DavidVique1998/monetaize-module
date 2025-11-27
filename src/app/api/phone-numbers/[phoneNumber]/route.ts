import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';
import { RetellService } from '@/lib/retell';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/phone-numbers/[phoneNumber]
 * 
 * Obtener un número telefónico específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> | { phoneNumber: string } }
) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const phoneNumber = decodeURIComponent(
      typeof resolvedParams.phoneNumber === 'string' 
        ? resolvedParams.phoneNumber 
        : String(resolvedParams.phoneNumber)
    );

    // Verificar que el número pertenece al usuario
    const phoneExists = await RetellSyncService.verifyPhoneNumberOwnership(user.id, phoneNumber);
    if (!phoneExists) {
      return NextResponse.json(
        { success: false, error: 'Phone number not found or does not belong to your account' },
        { status: 404 }
      );
    }

    // Obtener el número de Retell
    const retellPhone = await RetellService.getPhoneNumber(phoneNumber);
    
    return NextResponse.json({ success: true, data: retellPhone });
  } catch (error: any) {
    console.error('Error fetching phone number:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch phone number' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/phone-numbers/[phoneNumber]
 * 
 * Actualizar un número telefónico
 * 
 * Body:
 * {
 *   inbound_agent_id?: string,
 *   outbound_agent_id?: string,
 *   inbound_agent_version?: number,
 *   outbound_agent_version?: number,
 *   nickname?: string,
 *   inbound_webhook_url?: string,
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> | { phoneNumber: string } }
) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const phoneNumber = decodeURIComponent(
      typeof resolvedParams.phoneNumber === 'string' 
        ? resolvedParams.phoneNumber 
        : String(resolvedParams.phoneNumber)
    );

    // Verificar que el número pertenece al usuario
    const phoneExists = await RetellSyncService.verifyPhoneNumberOwnership(user.id, phoneNumber);
    if (!phoneExists) {
      return NextResponse.json(
        { success: false, error: 'Phone number not found or does not belong to your account' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      inbound_agent_id,
      outbound_agent_id,
      inbound_agent_version,
      outbound_agent_version,
      nickname,
      inbound_webhook_url,
    } = body;

    // Verificar que los agentes pertenecen al usuario
    if (inbound_agent_id) {
      const inboundAgentExists = await RetellSyncService.verifyAgentOwnership(user.id, inbound_agent_id);
      if (!inboundAgentExists) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Inbound agent with ID ${inbound_agent_id} does not belong to your account` 
          },
          { status: 404 }
        );
      }
    }

    if (outbound_agent_id) {
      const outboundAgentExists = await RetellSyncService.verifyAgentOwnership(user.id, outbound_agent_id);
      if (!outboundAgentExists) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Outbound agent with ID ${outbound_agent_id} does not belong to your account` 
          },
          { status: 404 }
        );
      }
    }

    // Preparar datos para actualizar en Retell
    const updateData: any = {};
    if (inbound_agent_id !== undefined) updateData.inbound_agent_id = inbound_agent_id || null;
    if (outbound_agent_id !== undefined) updateData.outbound_agent_id = outbound_agent_id || null;
    if (inbound_agent_version !== undefined) updateData.inbound_agent_version = inbound_agent_version || null;
    if (outbound_agent_version !== undefined) updateData.outbound_agent_version = outbound_agent_version || null;
    if (nickname !== undefined) updateData.nickname = nickname || null;
    if (inbound_webhook_url !== undefined) updateData.inbound_webhook_url = inbound_webhook_url || null;

    console.log('Updating phone number:', phoneNumber);
    console.log('Update data:', updateData);

    // Actualizar en Retell
    const retellPhone = await RetellService.updatePhoneNumber(phoneNumber, updateData);

    // Actualizar en la base de datos local
    const localPhone = await prisma.phoneNumber.update({
      where: { phoneNumber },
      data: {
        phoneNumberPretty: retellPhone.phone_number_pretty || null,
        phoneNumberType: retellPhone.phone_number_type || 'retell-twilio',
        nickname: retellPhone.nickname || null,
        inboundAgentId: retellPhone.inbound_agent_id || null,
        outboundAgentId: retellPhone.outbound_agent_id || null,
        inboundAgentVersion: retellPhone.inbound_agent_version || null,
        outboundAgentVersion: retellPhone.outbound_agent_version || null,
        inboundWebhookUrl: retellPhone.inbound_webhook_url || null,
        updatedAt: new Date(),
      },
    });

    console.log('Phone number updated successfully:', phoneNumber);

    return NextResponse.json({
      success: true,
      data: retellPhone,
      localPhone: localPhone
    });
  } catch (error: any) {
    console.error('Error updating phone number:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update phone number',
        details: error?.stack
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/phone-numbers/[phoneNumber]
 * 
 * Eliminar un número telefónico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> | { phoneNumber: string } }
) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Manejar params tanto en Next.js 13+ como versiones anteriores
    const resolvedParams = await params;
    const phoneNumber = decodeURIComponent(
      typeof resolvedParams.phoneNumber === 'string' 
        ? resolvedParams.phoneNumber 
        : String(resolvedParams.phoneNumber)
    );

    // Verificar que el número pertenece al usuario
    const phoneExists = await RetellSyncService.verifyPhoneNumberOwnership(user.id, phoneNumber);
    if (!phoneExists) {
      return NextResponse.json(
        { success: false, error: 'Phone number not found or does not belong to your account' },
        { status: 404 }
      );
    }

    // Eliminar de Retell
    await RetellService.deletePhoneNumber(phoneNumber);

    // Eliminar de la base de datos local
    await prisma.phoneNumber.delete({
      where: { phoneNumber },
    });

    console.log('Phone number deleted successfully:', phoneNumber);

    return NextResponse.json({
      success: true,
      message: 'Phone number deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting phone number:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete phone number' 
      },
      { status: 500 }
    );
  }
}

