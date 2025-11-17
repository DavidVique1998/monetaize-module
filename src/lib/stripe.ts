
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
  apiVersion: '2025-10-29.clover',
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
        type: 'redirect',
        redirect: {
          url: `${config.app.url}/wallet?recharge=success&amount=${amount}`,
        },
      },
    });

    // Guardar payment link en la base de datos
    // Calcular fecha de expiración (24 horas desde ahora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const dbPaymentLink = await prisma.paymentLink.create({
      data: {
        walletId: wallet.id,
        stripeLinkId: paymentLink.id,
        amount: amount,
        currency: currency,
        url: paymentLink.url,
        status: 'pending',
        expiresAt: expiresAt,
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
    console.log(`[Stripe Webhook] Evento recibido: ${event.type} (ID: ${event.id})`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('[Stripe Webhook] Procesando checkout.session.completed');
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        console.log('[Stripe Webhook] Procesando payment_intent.succeeded');
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_link.updated':
        console.log('[Stripe Webhook] Procesando payment_link.updated');
        await handlePaymentLinkUpdated(event.data.object as Stripe.PaymentLink);
        break;

      case 'checkout.session.async_payment_succeeded':
        console.log('[Stripe Webhook] Procesando checkout.session.async_payment_succeeded');
        // Para payment links con pagos asíncronos
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'setup_intent.succeeded':
        console.log('[Stripe Webhook] Procesando setup_intent.succeeded');
        // El Setup Intent se maneja en el frontend, pero podemos registrar aquí
        break;

      case 'payment_intent.payment_failed':
        console.log('[Stripe Webhook] Procesando payment_intent.payment_failed');
        // Manejar pagos fallidos (útil para notificaciones)
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.warn(`[Stripe] Pago fallido: ${failedPaymentIntent.id} - ${failedPaymentIntent.last_payment_error?.message}`);
        break;

      default:
        console.log(`[Stripe Webhook] Evento no manejado: ${event.type}`);
    }

    console.log(`[Stripe Webhook] Evento ${event.type} procesado exitosamente`);
    return { success: true };
  } catch (error: any) {
    console.error('[Stripe Webhook] Error al procesar webhook:', error);
    console.error('[Stripe Webhook] Stack trace:', error.stack);
    return {
      success: false,
      error: error.message || 'Error al procesar webhook',
    };
  }
}

/**
 * Obtener o crear un Stripe Customer para un usuario
 */
export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
  try {
    // Buscar si el usuario ya tiene un customer ID guardado
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Si el usuario ya tiene un customer ID guardado, verificar que existe en Stripe
    if (user.stripeCustomerId) {
      try {
        // Verificar que el customer existe en Stripe
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        
        // Si el customer fue eliminado, Stripe retorna un objeto con deleted: true
        if (customer.deleted) {
          console.warn(`[Stripe] Customer ${user.stripeCustomerId} fue eliminado en Stripe, creando uno nuevo`);
        } else {
          return user.stripeCustomerId;
        }
      } catch (error: any) {
        // Si el customer no existe (error 404), crear uno nuevo
        if (error.code === 'resource_missing') {
          console.warn(`[Stripe] Customer ${user.stripeCustomerId} no existe en Stripe, creando uno nuevo`);
        } else {
          throw error;
        }
      }
    }

    // Crear nuevo customer en Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: name || undefined,
      metadata: {
        userId: userId,
      },
    });

    // Guardar customer ID en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    console.log(`[Stripe] Customer creado y guardado: ${customer.id} para usuario ${userId}`);

    return customer.id;
  } catch (error: any) {
    console.error('[Stripe] Error creando/obteniendo customer:', error);
    throw new Error(`Error creando customer: ${error.message}`);
  }
}

/**
 * Crear un Setup Intent para guardar un método de pago
 * Esto permite al usuario guardar su tarjeta de forma segura
 */
export async function createSetupIntent(
  userId: string,
  email: string,
  name?: string
): Promise<{
  success: boolean;
  clientSecret?: string;
  setupIntentId?: string;
  error?: string;
}> {
  try {
    const customerId = await getOrCreateStripeCustomer(userId, email, name);

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        userId: userId,
        type: 'wallet_payment_method',
      },
    });

    return {
      success: true,
      clientSecret: setupIntent.client_secret || undefined,
      setupIntentId: setupIntent.id,
    };
  } catch (error: any) {
    console.error('[Stripe] Error creando setup intent:', error);
    return {
      success: false,
      error: error.message || 'Error creando setup intent',
    };
  }
}

/**
 * Cargar directamente usando un Payment Method guardado
 * Esta función se usa para recargas automáticas
 */
export async function chargePaymentMethod(
  userId: string,
  paymentMethodId: string,
  amount: number,
  currency: string = 'USD'
): Promise<{
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}> {
  try {
    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
      },
    });

    if (!user || !user.wallet) {
      return {
        success: false,
        error: 'Usuario o wallet no encontrado',
      };
    }

    // Obtener o crear customer
    const customerId = await getOrCreateStripeCustomer(
      userId,
      user.email,
      user.name || undefined
    );

    // Verificar que el payment method pertenece al customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (paymentMethod.customer && paymentMethod.customer !== customerId) {
      // Si el payment method tiene un customer diferente, attacharlo al customer correcto
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } else if (!paymentMethod.customer) {
      // Si no tiene customer, attacharlo
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    }

    // Crear Payment Intent para cobrar
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true, // Confirmar automáticamente
      return_url: `${config.app.url}/wallet?recharge=success&amount=${amount}`,
      metadata: {
        userId: userId,
        walletId: user.wallet.id,
        type: 'auto_recharge',
      },
      description: `Recarga automática de wallet: $${amount.toFixed(2)}`,
    });

    // Si el pago fue exitoso, agregar créditos a la wallet
    if (paymentIntent.status === 'succeeded') {
      const result = await addCredits(
        user.wallet.id,
        amount,
        paymentIntent.id
      );

      if (!result.success) {
        console.error('[Stripe] Error agregando créditos después de cobro exitoso:', result.error);
        // El pago ya se procesó, pero no se agregaron créditos
        // Esto debería manejarse con un webhook o proceso de reconciliación
      }
    }

    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.status !== 'succeeded' 
        ? `Payment status: ${paymentIntent.status}` 
        : undefined,
    };
  } catch (error: any) {
    console.error('[Stripe] Error cargando payment method:', error);
    
    // Manejar errores específicos de Stripe
    if (error.type === 'StripeCardError') {
      return {
        success: false,
        error: error.message || 'Error procesando la tarjeta',
      };
    }

    return {
      success: false,
      error: error.message || 'Error procesando el pago',
    };
  }
}

/**
 * Manejar checkout session completada
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe] Procesando checkout session completada:', {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    paymentIntent: session.payment_intent,
    paymentLink: session.payment_link,
    metadata: session.metadata,
    amountTotal: session.amount_total,
  });

  const walletId = session.metadata?.walletId;
  const userId = session.metadata?.userId;
  const amount = session.amount_total ? session.amount_total / 100 : 0; // Convertir de centavos a dólares

  if (!walletId || amount <= 0) {
    console.error('[Stripe] Datos incompletos en checkout session:', {
      walletId,
      userId,
      amount,
      sessionId: session.id,
    });
    return;
  }

  console.log(`[Stripe] Procesando recarga: $${amount} para wallet ${walletId}`);

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
  console.log(`[Stripe] Agregando créditos a wallet ${walletId}...`);
  const result = await addCredits(
    walletId,
    amount,
    session.payment_intent as string,
    paymentLink?.id
  );

  if (result.success) {
    console.log(`[Stripe] ✅ Recarga completada exitosamente: $${amount} para wallet ${walletId}`);
    console.log(`[Stripe] Nuevo balance: $${result.newBalance.toFixed(2)}`);
    console.log(`[Stripe] Transaction ID: ${result.transactionId}`);
  } else {
    console.error(`[Stripe] ❌ Error al agregar créditos: ${result.error}`);
  }
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

  // Si no se encuentra, buscar por invoice (payment links pueden crear invoices)
  // Nota: Payment Intents pueden tener invoice_id pero no invoice directamente
  if (!paymentLink && (paymentIntent as any).invoice) {
    // Obtener el invoice de Stripe para encontrar el payment link
    try {
      const invoiceId = typeof (paymentIntent as any).invoice === 'string' 
        ? (paymentIntent as any).invoice 
        : (paymentIntent as any).invoice?.id;
      
      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        // Los invoices pueden tener metadata con información del payment link
        if (invoice.metadata?.payment_link_id) {
          paymentLink = await prisma.paymentLink.findUnique({
            where: {
              stripeLinkId: invoice.metadata.payment_link_id,
            },
            include: {
              wallet: true,
            },
          });
        }
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

  console.log(`[Stripe] Procesando payment intent: $${amount} para wallet ${paymentLink.walletId}`);

  // Agregar créditos
  const result = await addCredits(
    paymentLink.walletId,
    amount,
    paymentIntent.id,
    paymentLink.id
  );

  if (result.success) {
    console.log(`[Stripe] ✅ Recarga completada exitosamente: $${amount} para wallet ${paymentLink.walletId}`);
    console.log(`[Stripe] Nuevo balance: $${result.newBalance.toFixed(2)}`);
    console.log(`[Stripe] Transaction ID: ${result.transactionId}`);
  } else {
    console.error(`[Stripe] ❌ Error al agregar créditos: ${result.error}`);
  }
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
  paymentIntentId?: string;
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
      console.log(`[Stripe] Intentando cobro directo con payment method ${wallet.autoRecharge.paymentMethodId}`);
      const directChargeResult = await chargePaymentMethod(
        wallet.userId,
        wallet.autoRecharge.paymentMethodId,
        rechargeAmount,
        wallet.currency
      );

      if (directChargeResult.success) {
        // Actualizar última recarga
        await prisma.autoRechargeSettings.update({
          where: { id: wallet.autoRecharge.id },
          data: {
            lastRechargeAt: new Date(),
          },
        });

        console.log(`[Stripe] ✅ Recarga automática completada: $${rechargeAmount} para wallet ${walletId}`);
        return {
          success: true,
          paymentIntentId: directChargeResult.paymentIntentId,
        };
      } else {
        console.warn(`[Stripe] ⚠️ Cobro directo falló: ${directChargeResult.error}. Creando payment link como fallback.`);
        // Continuar con payment link como fallback
      }
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
 * 
 * @returns Información sobre el proceso de verificación
 */
export async function checkAndProcessAutoRecharges(): Promise<{
  processed: number;
  skipped: number;
  errors: number;
  details: Array<{
    walletId: string;
    status: 'processed' | 'skipped' | 'error';
    reason?: string;
  }>;
}> {
  const result = {
    processed: 0,
    skipped: 0,
    errors: 0,
    details: [] as Array<{
      walletId: string;
      status: 'processed' | 'skipped' | 'error';
      reason?: string;
    }>,
  };

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

    console.log(`[Stripe] Verificando ${wallets.length} wallets con recarga automática habilitada`);

    for (const wallet of wallets) {
      try {
        const currentBalance = Number(wallet.balance);
        const threshold = Number(wallet.autoRecharge!.threshold);

        if (currentBalance <= threshold) {
          // Verificar si ya se procesó una recarga recientemente (últimas 24 horas)
          const lastRecharge = wallet.autoRecharge!.lastRechargeAt;
          const hoursSinceLastRecharge = lastRecharge
            ? (Date.now() - lastRecharge.getTime()) / (1000 * 60 * 60)
            : Infinity;

          if (hoursSinceLastRecharge > 24) {
            const rechargeResult = await processAutoRecharge(wallet.id);
            
            if (rechargeResult.success) {
              result.processed++;
              result.details.push({
                walletId: wallet.id,
                status: 'processed',
                reason: `Recarga iniciada: $${wallet.autoRecharge!.rechargeAmount}`,
              });
            } else {
              result.errors++;
              result.details.push({
                walletId: wallet.id,
                status: 'error',
                reason: rechargeResult.error || 'Error desconocido',
              });
            }
          } else {
            result.skipped++;
            result.details.push({
              walletId: wallet.id,
              status: 'skipped',
              reason: `Recarga reciente (hace ${Math.round(hoursSinceLastRecharge)} horas)`,
            });
          }
        } else {
          result.skipped++;
          result.details.push({
            walletId: wallet.id,
            status: 'skipped',
            reason: `Balance ($${currentBalance}) por encima del umbral ($${threshold})`,
          });
        }
      } catch (error: any) {
        result.errors++;
        result.details.push({
          walletId: wallet.id,
          status: 'error',
          reason: error.message || 'Error procesando wallet',
        });
        console.error(`[Stripe] Error procesando wallet ${wallet.id}:`, error);
      }
    }

    console.log(`[Stripe] Verificación completada: ${result.processed} procesadas, ${result.skipped} omitidas, ${result.errors} errores`);
  } catch (error) {
    console.error('[Stripe] Error al verificar recargas automáticas:', error);
    throw error;
  }

  return result;
}

