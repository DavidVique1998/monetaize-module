import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { getTransactionHistory } from '@/lib/wallet';

/**
 * GET /api/wallet/transactions - Obtener historial de transacciones
 * Query params: limit (default: 50), offset (default: 0)
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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const history = await getTransactionHistory(user.id, limit, offset);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
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

