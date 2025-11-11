import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { consumeCredits, getOrCreateWallet } from '@/lib/wallet';
import { z } from 'zod';

const consumeSchema = z.object({
  amount: z.number().positive(),
  metricType: z.string().optional(),
  metricValue: z.number().optional(),
  description: z.string().optional(),
  conversationId: z.string().optional(),
});

/**
 * POST /api/wallet/consume - Consumir créditos de la wallet
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
    const validatedData = consumeSchema.parse(body);

    // Obtener wallet del usuario
    const wallet = await getOrCreateWallet(user.id);

    // Consumir créditos
    const result = await consumeCredits({
      walletId: wallet.id,
      ...validatedData,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Error al consumir créditos',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance: result.newBalance,
        transactionId: result.transactionId,
      },
    });
  } catch (error) {
    console.error('Error consuming credits:', error);
    
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

