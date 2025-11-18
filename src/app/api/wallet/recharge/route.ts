import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { createPaymentLink } from '@/lib/stripe';
import { z } from 'zod';

const rechargeSchema = z.object({
  amount: z.number().positive().min(1),
  currency: z.string().optional().default('USD'),
});

/**
 * POST /api/wallet/recharge - Crear link de pago para recargar wallet
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
    const validatedData = rechargeSchema.parse(body);

    // Crear payment link
    const result = await createPaymentLink(
      user.id,
      validatedData.amount,
      validatedData.currency
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Error al crear link de pago',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentLinkId: result.paymentLinkId,
        url: result.url,
      },
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
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

