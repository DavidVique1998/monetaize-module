import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Función ligera para decodificar el token de sesión desde cookies
 * Versión optimizada para Edge Runtime (sin dependencias pesadas)
 * Compatible con base64url encoding usando Web APIs disponibles en Edge Runtime
 */
function decodeSessionToken(sessionToken: string | undefined): {
  userId: string;
  email: string;
  role: string;
  ghlLocationId: string | null;
  ghlCompanyId: string | null;
} | null {
  if (!sessionToken) return null;
  
  try {
    // Decodificar base64url (compatible con Edge Runtime usando Web API)
    // Reemplazar caracteres base64url a base64 estándar
    let base64 = sessionToken.replace(/-/g, '+').replace(/_/g, '/');
    
    // Agregar padding si es necesario
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decodificar usando Web API disponible en Edge Runtime
    // atob está disponible en Edge Runtime
    const binaryString = atob(base64);
    const parts = binaryString.split('|');
    
    if (parts.length < 3) return null;
    
    // Compatibilidad con tokens antiguos (sin ghlLocationId/ghlCompanyId)
    const ghlLocationId = parts.length > 3 && parts[3] ? parts[3] : null;
    const ghlCompanyId = parts.length > 4 && parts[4] ? parts[4] : null;
    
    return {
      userId: parts[0],
      email: parts[1],
      role: parts[2],
      ghlLocationId,
      ghlCompanyId,
    };
  } catch {
    return null;
  }
}

/**
 * Obtener datos de sesión desde las cookies del request
 * Versión ligera para Edge Runtime
 */
function getSessionFromRequest(cookies: { get: (name: string) => { value: string } | undefined }): {
  userId: string;
  email: string;
  role: string;
  ghlLocationId: string | null;
  ghlCompanyId: string | null;
} | null {
  const sessionCookie = cookies.get('monetaize_session');
  if (!sessionCookie) return null;
  
  return decodeSessionToken(sessionCookie.value);
}

/**
 * Middleware para controlar el acceso a las rutas de la aplicación
 * 
 * Rutas públicas:
 * - /install_ghl (pero redirige al dashboard si hay sesión)
 * - /api/oauth/* (endpoints de OAuth)
 * - /api/webhooks/* (webhooks externos)
 * 
 * Rutas protegidas:
 * - Todas las demás rutas requieren autenticación
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Excluir rutas de API y archivos estáticos
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    // Para rutas de API, solo manejar autenticación si es necesario
    const publicApiRoutes = [
      '/api/oauth',
      '/api/webhooks',
      '/api/auth/me',
      '/api/wallet/consume-token',
      '/api/wallet/consume-batch',
      '/api/public',
    ];

    if (!publicApiRoutes.some(route => pathname.startsWith(route))) {
      // Verificar autenticación para rutas de API protegidas
      const sessionData = getSessionFromRequest(request.cookies);
      if (sessionData) {
        const response = NextResponse.next();
        response.headers.set('x-user-id', sessionData.userId);
        response.headers.set('x-user-email', sessionData.email);
        response.headers.set('x-user-role', sessionData.role);
        if (sessionData.ghlLocationId) {
          response.headers.set('x-ghl-location-id', sessionData.ghlLocationId);
        }
        if (sessionData.ghlCompanyId) {
          response.headers.set('x-ghl-company-id', sessionData.ghlCompanyId);
        }
        return response;
      }
    }
    
    return NextResponse.next();
  }

  // Obtener locale de la cookie o usar default (inglés)
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
  
  // Crear respuesta base
  const response = NextResponse.next();
  
  // Establecer header de locale para que next-intl lo use
  response.headers.set('x-next-intl-locale', locale);
  
  // Si no hay cookie de locale, establecerla
  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 año
      sameSite: 'lax'
    });
  }

  // Rutas públicas que no requieren autenticación
  if (pathname === '/install_ghl') {
    const sessionData = getSessionFromRequest(request.cookies);
    
    if (sessionData) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/wallet';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    
    return response;
  }

  // Para todas las demás rutas, verificar autenticación
  const sessionData = getSessionFromRequest(request.cookies);

  if (!sessionData) {
    const loginUrl = new URL('/install_ghl', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Agregar headers con información de la sesión
  response.headers.set('x-user-id', sessionData.userId);
  response.headers.set('x-user-email', sessionData.email);
  response.headers.set('x-user-role', sessionData.role);
  
  if (sessionData.ghlLocationId) {
    response.headers.set('x-ghl-location-id', sessionData.ghlLocationId);
  }
  if (sessionData.ghlCompanyId) {
    response.headers.set('x-ghl-company-id', sessionData.ghlCompanyId);
  }

  // Content-Security-Policy para iframes de GoHighLevel
  const cspHeader = response.headers.get('Content-Security-Policy') || '';
  if (!cspHeader.includes('frame-ancestors')) {
    response.headers.set(
      'Content-Security-Policy',
      `frame-ancestors 'self' https://*.gohighlevel.com https://*.highlevel.com; ${cspHeader}`
    );
  }

  return response;
}

/**
 * Configuración del matcher para el middleware
 * Excluye archivos estáticos, imágenes, y archivos de Next.js
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

