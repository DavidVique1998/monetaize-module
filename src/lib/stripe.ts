/**
 * Servicio de Stripe - Manejo de pagos y links de pago
 * Proporciona funciones para crear links de pago, procesar webhooks y recarga automática
 */

import Stripe from 'stripe';
import { config } from './config';
import { PrismaClient } from '@prisma/client';
import { addCredits, getOrCreateWallet } from './wallet';

const prisma = new PrismaClient();

// Inicializar Stripe
export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Crear un link de pago para recargar la wallet
 */
export async function createPaymentLink(
  userId: string,
  amount: number,
  currency: string = 'USD'
): Promise<{
  success: boolean;
  paymentLinkId?: string;
  url?: string;
  error?: string;
}> {
  try {
    // Validar monto
    if (amount <= 0) {
      return {
        success: false,
        error: 'El monto debe ser mayor a 0',
      };
    }

    // Obtener o crear wallet
    const wallet = await getOrCreateWallet(userId);

    // Crear payment link en Stripe
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Recarga de Wallet',
              description: `Recarga de $${amount.toFixed(2)} para tu wallet`,
            },
            unit_amount: Math.round(amount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      metadata: {
        walletId: wallet.id,
        userId: userId,
        type: 'wallet_recharge',
      },
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: '¡Recarga exitosa! Tu saldo se actualizará en breve.',
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // Expira en 24 horas
    });

    // Guardar payment link en la base de datos
    const dbPaymentLink = await prisma.paymentLink.create({
      data: {
        walletId: wallet.id,
        stripeLinkId: paymentLink.id,
        amount: amount,
        currency: currency,
        url: paymentLink.url,
        status: 'pending',
        expiresAt: paymentLink.expires_at
          ? new Date(paymentLink.expires_at * 1000)
          : null,
      },
    });

    return {
      success: true,
      paymentLinkId: dbPaymentLink.id,
      url: paymentLink.url,
    };
  } catch (error: any) {
    console.error('[Stripe] Error al crear payment link:', error);
    return {
      success: false,
      error: error.message || 'Error al crear link de pago',
    };
  }
}

/**
 * Procesar webhook de Stripe
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_link.updated':
        await handlePaymentLinkUpdated(event.data.object as Stripe.PaymentLink);
        break;

      case 'checkout.session.async_payment_succeeded':
        // Para payment links con pagos asíncronos
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`[Stripe] Evento no manejado: ${event.type}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Stripe] Error al procesar webhook:', error);
    return {
      success: false,
      error: error.message || 'Error al procesar webhook',
    };
  }
}

/**
 * Manejar checkout session completada
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const walletId = session.metadata?.walletId;
  const userId = session.metadata?.userId;
  const amount = session.amount_total ? session.amount_total / 100 : 0; // Convertir de centavos a dólares

  if (!walletId || amount <= 0) {
    console.error('[Stripe] Datos incompletos en checkout session:', {
      walletId,
      userId,
      amount,
    });
    return;
  }

  // Buscar payment link por payment link ID, metadata o por wallet
  let paymentLink = null;
  
  // Primero intentar por payment_link en la sesión
  if (session.payment_link) {
    paymentLink = await prisma.paymentLink.findUnique({
      where: {
        stripeLinkId: session.payment_link as string,
      },
    });
  }

  // Si no se encuentra, buscar por metadata del payment link
  if (!paymentLink && session.metadata?.payment_link_id) {
    paymentLink = await prisma.paymentLink.findUnique({
      where: {
        stripeLinkId: session.metadata.payment_link_id,
      },
    });
  }

  // Si aún no se encuentra, buscar el más reciente pendiente para esta wallet
  if (!paymentLink && walletId) {
    paymentLink = await prisma.paymentLink.findFirst({
      where: {
        walletId,
        status: 'pending',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Agregar créditos a la wallet
  await addCredits(
    walletId,
    amount,
    session.payment_intent as string,
    paymentLink?.id
  );

  console.log(`[Stripe] Recarga completada: $${amount} para wallet ${walletId}`);
}

/**
 * Manejar payment intent exitoso
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Buscar payment link por metadata o por invoice
  let paymentLink = null;
  
  if (paymentIntent.metadata?.payment_link_id) {
    paymentLink = await prisma.paymentLink.findUnique({
      where: {
        stripeLinkId: paymentIntent.metadata.payment_link_id,
      },
      include: {
        wallet: true,
      },
    });
  }

  // Si no se encuentra, buscar por invoice (payment links crean invoices)
  if (!paymentLink && paymentIntent.invoice) {
    // Obtener el invoice de Stripe para encontrar el payment link
    try {
      const invoice = await stripe.invoices.retrieve(paymentIntent.invoice as string);
      if (invoice.subscription_details?.metadata?.payment_link_id) {
        paymentLink = await prisma.paymentLink.findUnique({
          where: {
            stripeLinkId: invoice.subscription_details.metadata.payment_link_id,
          },
          include: {
            wallet: true,
          },
        });
      }
    } catch (error) {
      console.error('[Stripe] Error obteniendo invoice:', error);
    }
  }

  if (!paymentLink) {
    console.log('[Stripe] Payment link no encontrado para payment intent:', paymentIntent.id);
    return;
  }

  const amount = paymentIntent.amount / 100; // Convertir de centavos a dólares

  // Agregar créditos
  await addCredits(
    paymentLink.walletId,
    amount,
    paymentIntent.id,
    paymentLink.id
  );

  console.log(`[Stripe] Recarga completada: $${amount} para wallet ${paymentLink.walletId}`);
}

/**
 * Manejar actualización de payment link
 */
async function handlePaymentLinkUpdated(paymentLink: Stripe.PaymentLink) {
  await prisma.paymentLink.updateMany({
    where: {
      stripeLinkId: paymentLink.id,
    },
    data: {
      status: paymentLink.active ? 'pending' : 'expired',
    },
  });
}

/**
 * Procesar recarga automática
 */
export async function processAutoRecharge(walletId: string): Promise<{
  success: boolean;
  paymentLinkId?: string;
  url?: string;
  error?: string;
}> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        autoRecharge: true,
        user: true,
      },
    });

    if (!wallet || !wallet.autoRecharge || !wallet.autoRecharge.enabled) {
      return {
        success: false,
        error: 'Recarga automática no habilitada',
      };
    }

    const currentBalance = Number(wallet.balance);
    const threshold = Number(wallet.autoRecharge.threshold);
    const rechargeAmount = Number(wallet.autoRecharge.rechargeAmount);

    // Verificar si el balance está por debajo del umbral
    if (currentBalance > threshold) {
      return {
        success: false,
        error: 'Balance por encima del umbral',
      };
    }

    // Si hay un método de pago guardado, intentar cobro directo
    if (wallet.autoRecharge.paymentMethodId) {
      // TODO: Implementar cobro directo con payment method guardado
      // Por ahora, creamos un payment link
    }

    // Crear payment link para recarga automática
    const result = await createPaymentLink(
      wallet.userId,
      rechargeAmount,
      wallet.currency
    );

    if (result.success) {
      // Actualizar última recarga
      await prisma.autoRechargeSettings.update({
        where: { id: wallet.autoRecharge.id },
        data: {
          lastRechargeAt: new Date(),
        },
      });

      console.log(`[Stripe] Recarga automática iniciada: $${rechargeAmount} para wallet ${walletId}`);
    }

    return result;
  } catch (error: any) {
    console.error('[Stripe] Error en recarga automática:', error);
    return {
      success: false,
      error: error.message || 'Error en recarga automática',
    };
  }
}

/**
 * Verificar y procesar recargas automáticas pendientes
 * Esta función debe ejecutarse periódicamente (cron job)
 */
export async function checkAndProcessAutoRecharges() {
  try {
    const wallets = await prisma.wallet.findMany({
      where: {
        autoRecharge: {
          enabled: true,
        },
      },
      include: {
        autoRecharge: true,
      },
    });

    for (const wallet of wallets) {
      const currentBalance = Number(wallet.balance);
      const threshold = Number(wallet.autoRecharge!.threshold);

      if (currentBalance <= threshold) {
        // Verificar si ya se procesó una recarga recientemente (últimas 24 horas)
        const lastRecharge = wallet.autoRecharge!.lastRechargeAt;
        const hoursSinceLastRecharge = lastRecharge
          ? (Date.now() - lastRecharge.getTime()) / (1000 * 60 * 60)
          : Infinity;

        if (hoursSinceLastRecharge > 24) {
          await processAutoRecharge(wallet.id);
        }
      }
    }
  } catch (error) {
    console.error('[Stripe] Error al verificar recargas automáticas:', error);
  }
}

