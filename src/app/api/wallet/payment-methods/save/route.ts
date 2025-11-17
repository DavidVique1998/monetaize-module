import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { getOrCreateWallet } from '@/lib/wallet';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';

const prisma = new PrismaClient();

const savePaymentMethodSchema = z.object({
  setupIntentId: z.string(),
});

/**
 * POST /api/wallet/payment-methods/save
 * Guardar un método de pago después de completar el Setup Intent
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionManager.getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { setupIntentId } = savePaymentMethodSchema.parse(body);

    // Obtener el Setup Intent de Stripe
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, error: `Setup Intent no completado. Status: ${setupIntent.status}` },
        { status: 400 }
      );
    }

    if (!setupIntent.payment_method) {
      return NextResponse.json(
        { success: false, error: 'No se encontró método de pago en el Setup Intent' },
        { status: 400 }
      );
    }

    const paymentMethodId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method.id;

    // Obtener o crear wallet
    const wallet = await getOrCreateWallet(user.id);

    // Actualizar la configuración de recarga automática con el payment method
    const autoRecharge = await prisma.autoRechargeSettings.upsert({
      where: { walletId: wallet.id },
      create: {
        walletId: wallet.id,
        enabled: false, // No habilitar automáticamente
        threshold: 10,
        rechargeAmount: 50,
        paymentMethodId: paymentMethodId,
      },
      update: {
        paymentMethodId: paymentMethodId,
      },
    });

    // Obtener información del payment method
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        } : null,
      },
      autoRecharge: {
        enabled: autoRecharge.enabled,
        paymentMethodId: autoRecharge.paymentMethodId,
      },
    });
  } catch (error: any) {
    console.error('Error saving payment method:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error guardando método de pago',
      },
      { status: 500 }
    );
  }
}

