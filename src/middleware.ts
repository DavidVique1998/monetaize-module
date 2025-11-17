import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SessionManager } from '@/lib/session';

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

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/install_ghl',
    '/api/oauth',
    '/api/webhooks',
    '/api/auth/me', // Permitir verificar sesión sin autenticación
    '/api/wallet/consume-token', // Endpoint público que usa JWT para autenticación
  ];

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Si es una ruta pública, verificar si hay sesión para redirigir
  if (pathname === '/install_ghl') {
    // Verificar sesión sin usar Prisma (Edge Runtime compatible)
    const sessionData = SessionManager.getSessionUserFromRequest(request.cookies as any);
    
    // Si hay sesión activa, redirigir al dashboard
    if (sessionData) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/';
      console.log('[Middleware] Usuario autenticado, redirigiendo desde /install_ghl a:', redirectTo);
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    
    // Si no hay sesión, permitir acceso a la página de instalación
    return NextResponse.next();
  }

  // Permitir acceso a rutas de API públicas (OAuth, webhooks, auth/me, y consume-token)
  if (isPublicRoute && (
    pathname.startsWith('/api/oauth') || 
    pathname.startsWith('/api/webhooks') ||
    pathname === '/api/auth/me' ||
    pathname === '/api/wallet/consume-token'
  )) {
    return NextResponse.next();
  }

  // Para todas las demás rutas, verificar autenticación
  // Verificar sesión sin usar Prisma (Edge Runtime compatible)
  const sessionData = SessionManager.getSessionUserFromRequest(request.cookies as any);

  // Si no hay usuario autenticado, redirigir a install_ghl
  if (!sessionData) {
    const loginUrl = new URL('/install_ghl', request.url);
    // Preservar la URL original para redirigir después del login
    loginUrl.searchParams.set('redirect', pathname);
    console.log('[Middleware] Usuario no autenticado, redirigiendo a:', loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  // Usuario autenticado, agregar información de sesión a los headers
  // Esto permite acceder fácilmente al locationId en cualquier API route
  const response = NextResponse.next();
  
  // Agregar headers con información de la sesión para fácil acceso
  response.headers.set('x-user-id', sessionData.userId);
  response.headers.set('x-user-email', sessionData.email);
  response.headers.set('x-user-role', sessionData.role);
  
  // Agregar locationId si está disponible (importante para GHL)
  if (sessionData.ghlLocationId) {
    response.headers.set('x-ghl-location-id', sessionData.ghlLocationId);
  }
  if (sessionData.ghlCompanyId) {
    response.headers.set('x-ghl-company-id', sessionData.ghlCompanyId);
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

