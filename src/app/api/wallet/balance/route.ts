import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { getWalletBalance } from '@/lib/wallet';

/**
 * GET /api/wallet/balance - Obtener balance de la wallet del usuario
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

    const balance = await getWalletBalance(user.id);

    return NextResponse.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
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

