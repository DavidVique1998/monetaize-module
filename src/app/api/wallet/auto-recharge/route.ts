import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { getOrCreateWallet } from '@/lib/wallet';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const autoRechargeSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number().positive().optional(),
  rechargeAmount: z.number().positive().optional(),
  paymentMethodId: z.string().optional().nullable(),
});

/**
 * GET /api/wallet/auto-recharge - Obtener configuración de recarga automática
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionManager.getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const wallet = await getOrCreateWallet(user.id);

    const autoRecharge = await prisma.autoRechargeSettings.findUnique({
      where: { walletId: wallet.id },
    });

    if (!autoRecharge) {
      // Crear configuración por defecto si no existe
      const newAutoRecharge = await prisma.autoRechargeSettings.create({
        data: {
          walletId: wallet.id,
          enabled: false,
          threshold: 10,
          rechargeAmount: 50,
        },
      });

      return NextResponse.json({
        success: true,
        data: newAutoRecharge,
      });
    }

    return NextResponse.json({
      success: true,
      data: autoRecharge,
    });
  } catch (error) {
    console.error('Error getting auto-recharge settings:', error);
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

/**
 * PATCH /api/wallet/auto-recharge - Actualizar configuración de recarga automática
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await SessionManager.getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = autoRechargeSchema.parse(body);

    const wallet = await getOrCreateWallet(user.id);

    // Obtener o crear configuración
    let autoRecharge = await prisma.autoRechargeSettings.findUnique({
      where: { walletId: wallet.id },
    });

    if (!autoRecharge) {
      autoRecharge = await prisma.autoRechargeSettings.create({
        data: {
          walletId: wallet.id,
          enabled: validatedData.enabled,
          threshold: validatedData.threshold || 10,
          rechargeAmount: validatedData.rechargeAmount || 50,
          paymentMethodId: validatedData.paymentMethodId || null,
        },
      });
    } else {
      // Actualizar configuración existente
      autoRecharge = await prisma.autoRechargeSettings.update({
        where: { walletId: wallet.id },
        data: {
          enabled: validatedData.enabled,
          ...(validatedData.threshold !== undefined && { threshold: validatedData.threshold }),
          ...(validatedData.rechargeAmount !== undefined && { rechargeAmount: validatedData.rechargeAmount }),
          ...(validatedData.paymentMethodId !== undefined && { paymentMethodId: validatedData.paymentMethodId }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: autoRecharge,
    });
  } catch (error) {
    console.error('Error updating auto-recharge settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

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

