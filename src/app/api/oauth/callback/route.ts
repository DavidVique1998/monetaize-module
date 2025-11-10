import { NextRequest, NextResponse } from 'next/server';
import { GHLApp } from '@/lib/ghlApp';
import { config } from '@/lib/config';

/**
 * Endpoint de OAuth Callback para GoHighLevel
 * 
 * Este endpoint maneja el callback de OAuth 2.0 cuando una agencia autoriza la aplicación.
 * GHL redirige aquí con un código de autorización que se intercambia por tokens.
 * 
 * El SDK automáticamente:
 * - Intercambia el código por Agency Access Token y Refresh Token
 * - Almacena los tokens en MongoDB (sessionStorage)
 * 
 * Configuración requerida en GHL Marketplace:
 * - Redirect URL: https://tu-dominio.com/api/oauth/callback
 * 
 * Flujo:
 * 1. Usuario autoriza la app en GHL Marketplace
 * 2. GHL redirige a este endpoint con ?code=xxx&companyId=xxx
 * 3. El SDK intercambia el código por tokens
 * 4. Los tokens se almacenan en MongoDB
 * 5. Redirige al usuario a una página de éxito
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const companyId = config.ghlApp.companyId;

    // Si hay un error en la autorización
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/installer?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`,
          config.app.url
        )
      );
    }

    // Validar que tenemos el código y companyId
    if (!code || !companyId) {
      console.error('Missing code or companyId in OAuth callback');
      return NextResponse.redirect(
        new URL(
          '/installer?error=missing_parameters&error_description=Missing code or companyId',
          config.app.url
        )
      );
    }

    console.log('OAuth callback recibido:', {
      code: code.substring(0, 10) + '...',
      companyId,
      timestamp: new Date().toISOString()
    });

    // Obtener la instancia del SDK
    const ghlApp = GHLApp.getInstance();
    const ghl = ghlApp.getSDK();

    try {
      // Asegurar que MongoDB esté inicializado
      await ghlApp.initialize();

      // Intercambiar el código de autorización por tokens usando el SDK
      const redirectUri = `${config.app.url}/api/oauth/callback`;
      
      console.log('Intercambiando código por tokens...');
      
      const tokenResponse = await ghl.oauth.getAccessToken({
        client_id: config.ghlApp.appId,
        client_secret: config.ghlApp.apiSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        user_type: 'Company' // Para obtener el Agency Access Token
      });

      console.log('Tokens obtenidos exitosamente:', {
        companyId: tokenResponse.companyId,
        userId: tokenResponse.userId,
        hasAccessToken: !!tokenResponse.access_token,
        hasRefreshToken: !!tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in
      });

      // El SDK automáticamente almacena los tokens en el sessionStorage cuando se llama a getAccessToken
      // pero necesitamos almacenarlos explícitamente para el companyId
      // El sessionStorage calcula automáticamente expire_at basándose en expires_in
      if (tokenResponse.access_token) {
        const finalCompanyId = tokenResponse.companyId || companyId;
        const sessionStorage = ghlApp.getSessionStorage();
        
        await sessionStorage.setSession(finalCompanyId, {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          token_type: tokenResponse.token_type,
          scope: tokenResponse.scope,
          userType: tokenResponse.userType || 'Company',
          companyId: finalCompanyId,
          userId: tokenResponse.userId,
          expires_in: tokenResponse.expires_in
          // expire_at se calcula automáticamente por el sessionStorage
        });
        
        console.log('Tokens almacenados en MongoDB para companyId:', finalCompanyId);
      }

      // Redirigir al usuario a la página de instalador con éxito
      return NextResponse.redirect(
        new URL(
          `/installer?success=true&companyId=${companyId}&message=Authorization successful. Tokens stored.`,
          config.app.url
        )
      );
    } catch (error: any) {
      console.error('Error procesando OAuth callback:', error);
      return NextResponse.redirect(
        new URL(
          `/installer?error=oauth_failed&error_description=${encodeURIComponent(error.message || 'Failed to process OAuth callback')}`,
          config.app.url
        )
      );
    }
  } catch (error) {
    console.error('Error en OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.redirect(
      new URL(
        `/installer?error=callback_error&error_description=${encodeURIComponent(errorMessage)}`,
        config.app.url
      )
    );
  }
}

