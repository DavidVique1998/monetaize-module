import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { getOrCreateWallet } from '@/lib/wallet';
import { PrismaClient } from '@prisma/client';
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe';

const prisma = new PrismaClient();

/**
 * GET /api/wallet/payment-methods
 * Obtener métodos de pago guardados del usuario
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

    if (!autoRecharge?.paymentMethodId) {
      return NextResponse.json({
        success: true,
        paymentMethods: [],
      });
    }

    // Obtener información del payment method de Stripe
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(autoRecharge.paymentMethodId);

      return NextResponse.json({
        success: true,
        paymentMethods: [
          {
            id: paymentMethod.id,
            type: paymentMethod.type,
            card: paymentMethod.card ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
            } : null,
            isDefault: true,
          },
        ],
      });
    } catch (error: any) {
      // Si el payment method no existe o fue eliminado, limpiar la referencia
      if (error.code === 'resource_missing') {
        await prisma.autoRechargeSettings.update({
          where: { walletId: wallet.id },
          data: { paymentMethodId: null },
        });
      }

      return NextResponse.json({
        success: true,
        paymentMethods: [],
      });
    }
  } catch (error: any) {
    console.error('Error getting payment methods:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error obteniendo métodos de pago',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wallet/payment-methods/:paymentMethodId
 * Eliminar un método de pago guardado
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await SessionManager.getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'paymentMethodId es requerido' },
        { status: 400 }
      );
    }

    const wallet = await getOrCreateWallet(user.id);
    const autoRecharge = await prisma.autoRechargeSettings.findUnique({
      where: { walletId: wallet.id },
    });

    // Verificar que el payment method pertenece al usuario
    if (autoRecharge?.paymentMethodId !== paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Método de pago no encontrado' },
        { status: 404 }
      );
    }

    // Detach el payment method de Stripe (no lo elimina, solo lo desasocia)
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error: any) {
      // Si ya fue detachado, continuar
      if (error.code !== 'resource_missing') {
        throw error;
      }
    }

    // Eliminar la referencia en la base de datos
    await prisma.autoRechargeSettings.update({
      where: { walletId: wallet.id },
      data: { paymentMethodId: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Método de pago eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error eliminando método de pago',
      },
      { status: 500 }
    );
  }
}

