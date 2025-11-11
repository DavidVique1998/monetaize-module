import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleStripeWebhook } from '@/lib/stripe';
import { config } from '@/lib/config';
import Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe - Webhook de Stripe para procesar eventos de pago
 * 
 * IMPORTANTE: En producción, Stripe debe estar configurado para enviar eventos a esta URL.
 * El webhook secret debe estar configurado en las variables de entorno.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!config.stripe.webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET no configurado');
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verificar y parsear el evento
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripe.webhookSecret
      );
    } catch (err: any) {
      console.error('[Stripe Webhook] Error verificando firma:', err.message);
      return NextResponse.json(
        { success: false, error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Procesar el evento
    const result = await handleStripeWebhook(event);

    if (!result.success) {
      console.error('[Stripe Webhook] Error procesando evento:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error('[Stripe Webhook] Error inesperado:', error);
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

