import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';

/**
 * Endpoint para cerrar sesión
 */
export async function POST(request: NextRequest) {
  try {
    await SessionManager.destroySession();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error logging out:', error);
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

