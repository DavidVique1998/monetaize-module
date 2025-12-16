import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';

const SESSION_COOKIE_NAME = 'monetaize_session';
const isProduction = process.env.NODE_ENV === 'production';
const enableIframeCookies = process.env.ENABLE_IFRAME_COOKIES === 'true' || isProduction;

/**
 * Endpoint para cerrar sesión
 */
export async function POST(request: NextRequest) {
  try {
    // Destruir la sesión en el servidor
    await SessionManager.destroySession();

    // Crear respuesta y eliminar explícitamente la cookie en el cliente
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Eliminar la cookie con las mismas opciones que se usaron para crearla
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: enableIframeCookies || isProduction,
      sameSite: (enableIframeCookies ? 'none' : 'lax') as 'lax' | 'none',
      maxAge: 0, // Expirar inmediatamente
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );

    // Aún así, intentar eliminar la cookie en caso de error
    errorResponse.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: enableIframeCookies || isProduction,
      sameSite: (enableIframeCookies ? 'none' : 'lax') as 'lax' | 'none',
      maxAge: 0,
      path: '/',
    });

    return errorResponse;
  }
}

