import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { createSetupIntent } from '@/lib/stripe';

/**
 * POST /api/wallet/payment-methods/setup
 * Crear un Setup Intent para guardar un método de pago
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

    const result = await createSetupIntent(user.id, user.email, user.name || undefined);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      setupIntentId: result.setupIntentId,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error creando setup intent',
      },
      { status: 500 }
    );
  }
}

