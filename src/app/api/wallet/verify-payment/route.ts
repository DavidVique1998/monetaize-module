import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/wallet/verify-payment - Verificar el estado de un pago de Stripe
 * Body: { paymentLinkId: string } o { stripePaymentId: string }
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
    const { paymentLinkId, stripePaymentId } = body;

    if (!paymentLinkId && !stripePaymentId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere paymentLinkId o stripePaymentId' },
        { status: 400 }
      );
    }

    let paymentLink = null;
    let stripePayment = null;

    // Buscar payment link en la base de datos
    if (paymentLinkId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: paymentLinkId },
        include: {
          wallet: {
            include: {
              user: true,
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!paymentLink) {
        return NextResponse.json(
          { success: false, error: 'Payment link no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que el payment link pertenece al usuario
      if (paymentLink.wallet.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 403 }
        );
      }

      // Obtener información del payment link desde Stripe
      try {
        stripePayment = await stripe.paymentLinks.retrieve(paymentLink.stripeLinkId);
      } catch (error) {
        console.error('[Verify Payment] Error obteniendo payment link de Stripe:', error);
      }
    }

    // Si tenemos un stripePaymentId, buscar la transacción
    if (stripePaymentId) {
      const transaction = await prisma.walletTransaction.findFirst({
        where: { stripePaymentId },
        include: {
          wallet: {
            include: {
              user: true,
            },
          },
        },
      });

      if (transaction && transaction.wallet.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          transaction: transaction ? {
            id: transaction.id,
            amount: Number(transaction.amount),
            status: transaction.status,
            createdAt: transaction.createdAt,
            balanceAfter: Number(transaction.balanceAfter),
          } : null,
          wallet: transaction ? {
            balance: Number(transaction.wallet.balance),
          } : null,
        },
      });
    }

    // Retornar información del payment link
    return NextResponse.json({
      success: true,
      data: {
        paymentLink: {
          id: paymentLink!.id,
          status: paymentLink!.status,
          amount: Number(paymentLink!.amount),
          createdAt: paymentLink!.createdAt,
          paidAt: paymentLink!.paidAt,
        },
        stripePayment: stripePayment ? {
          active: stripePayment.active,
          livemode: stripePayment.livemode,
        } : null,
        wallet: {
          balance: Number(paymentLink!.wallet.balance),
        },
        lastTransaction: paymentLink!.transactions[0] ? {
          id: paymentLink!.transactions[0].id,
          amount: Number(paymentLink!.transactions[0].amount),
          status: paymentLink!.transactions[0].status,
          createdAt: paymentLink!.transactions[0].createdAt,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
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





