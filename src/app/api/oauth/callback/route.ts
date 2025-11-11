import { NextRequest, NextResponse } from 'next/server';
import { GHLApp } from '@/lib/ghlApp';
import { config } from '@/lib/config';
import { PrismaClient } from '@prisma/client';
import { SessionManager, type SessionUser } from '@/lib/session';

const prisma = new PrismaClient();

/**
 * Endpoint de OAuth Callback para GoHighLevel
 * 
 * Este endpoint maneja el callback de OAuth 2.0 cuando una location autoriza la aplicación.
 * GHL redirige aquí con un código de autorización que se intercambia por tokens.
 * 
 * Flujo:
 * 1. Usuario autoriza la app en GHL Marketplace y selecciona una location
 * 2. GHL redirige a este endpoint con ?code=xxx&locationId=xxx&companyId=xxx
 * 3. El SDK intercambia el código por tokens (primero Company, luego Location)
 * 4. Se obtiene la información de la location
 * 5. Se crea/actualiza el usuario en el sistema
 * 6. Se crea la sesión y se hace login automático
 * 7. Redirige al dashboard
 * 
 * Configuración requerida en GHL Marketplace:
 * - Redirect URL: https://tu-dominio.com/api/oauth/callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Si hay un error en la autorización
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/install_ghl?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`,
          config.app.url
        )
      );
    }

    // Validar que tenemos el código y locationId
    if (!code) {
      console.error('Missing code or locationId in OAuth callback');
      return NextResponse.redirect(
        new URL(
          '/install_ghl?error=missing_parameters&error_description=Missing code or locationId',
          config.app.url
        )
      );
    }

    // Obtener la instancia del SDK
    const ghlApp = GHLApp.getInstance();
    const ghl = ghlApp.getSDK();

    try {
      // Asegurar que MongoDB esté inicializado
      await ghlApp.initialize();

      // Paso 1: Intercambiar el código por Company Token
      const redirectUri = `${config.app.url}/api/oauth/callback`;
      
      console.log('Intercambiando código por Company Token...');
      
      const tokenResponse = await ghl.oauth.getAccessToken({
        client_id: config.ghlApp.appId,
        client_secret: config.ghlApp.apiSecret,
        grant_type: 'authorization_code',
        code: code
      });

      const companyId = tokenResponse.companyId;
      const locationId = tokenResponse.locationId;
      if (!companyId || !locationId) {
        throw new Error('Company ID or location ID not found in token response');
      }

      // Guardar el token de company
      const sessionStorage = ghlApp.getSessionStorage();
      await sessionStorage.setSession(locationId, {
        access_token: tokenResponse.access_token!,
        refresh_token: tokenResponse.refresh_token!,
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        userType: tokenResponse.userType,
        companyId: companyId,
        userId: tokenResponse.userId,
        expires_in: tokenResponse.expires_in
      });
      // Paso 3: Obtener información de la location
      console.log('Obteniendo información de la location...');
      const locationInfo = await ghl.locations.getLocation({
        locationId,
      });

      const location = locationInfo.location;
      if (!location) {
        throw new Error('Location not found');
      }

      // Paso 4: Crear o actualizar usuario en el sistema
      const locationEmail = location.email || `${locationId}@ghl.location`;
      const locationName = location.name || 'Location sin nombre';

      let user = await prisma.user.findUnique({
        where: { ghlLocationId: locationId },
      });

      if (user) {
        // Actualizar usuario existente
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: locationEmail,
            name: locationName,
            role: 'LOCATION',
            ghlLocationId: locationId,
            ghlCompanyId: companyId,
            ghlLocationName: location.name,
            ghlLocationAddress: location.address,
            ghlLocationCity: location.city,
            ghlLocationState: location.state,
            ghlLocationPhone: location.phone,
            ghlLocationEmail: location.email,
            ghlLocationWebsite: location.website,
            ghlLocationTimezone: location.timezone,
          },
        });
        console.log('Usuario actualizado:', user.id);
      } else {
        // Crear nuevo usuario
        user = await prisma.user.create({
          data: {
            email: locationEmail,
            name: locationName,
            role: 'LOCATION',
            ghlLocationId: locationId,
            ghlCompanyId: companyId,
            ghlLocationName: location.name,
            ghlLocationAddress: location.address,
            ghlLocationCity: location.city,
            ghlLocationState: location.state,
            ghlLocationPhone: location.phone,
            ghlLocationEmail: location.email,
            ghlLocationWebsite: location.website,
            ghlLocationTimezone: location.timezone,
          },
        });
        console.log('Usuario creado:', user.id);
      }

      // Paso 5: Crear sesión y hacer login automático
      // Redirigir directamente al dashboard usando la URL del request
      const dashboardUrl = new URL('/', request.url);
      
      // Crear la respuesta de redirección
      const response = NextResponse.redirect(dashboardUrl);
      
      // Preparar datos del usuario para la sesión
      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'ADMIN' | 'LOCATION',
        ghlLocationId: user.ghlLocationId,
        ghlCompanyId: user.ghlCompanyId,
      };
      
      // Establecer la cookie de sesión en la respuesta (almacena datos del usuario)
      SessionManager.createSession(response, sessionUser);

      console.log('[OAuth Callback] Sesión creada para usuario:', user.id);
      console.log('[OAuth Callback] Redirigiendo a:', dashboardUrl.toString());

      return response;
    } catch (error: any) {
      console.error('Error procesando OAuth callback:', error);
      return NextResponse.redirect(
        new URL(
          `/install_ghl?error=oauth_failed&error_description=${encodeURIComponent(error.message || 'Failed to process OAuth callback')}`,
          config.app.url
        )
      );
    }
  } catch (error) {
    console.error('Error en OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.redirect(
      new URL(
        `/install_ghl?error=callback_error&error_description=${encodeURIComponent(errorMessage)}`,
        config.app.url
      )
    );
  }
}

