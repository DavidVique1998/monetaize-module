import { NextRequest, NextResponse } from 'next/server';
import { GHLApp } from '@/lib/ghlApp';
import { config } from '@/lib/config';

/**
 * Endpoint de Webhook para GoHighLevel
 * 
 * Este endpoint maneja los eventos INSTALL y UNINSTALL de la aplicación.
 * Replica la lógica del middleware subscribe() del SDK para Next.js.
 * 
 * El SDK automáticamente:
 * - Verifica la firma del webhook (si está configurada)
 * - Para INSTALL: Genera y almacena tokens de location usando el token de company
 * - Para UNINSTALL: Elimina tokens del sessionStorage (MongoDB)
 * 
 * Configuración requerida en GHL Marketplace:
 * - Default Webhook URL: https://tu-dominio.com/api/webhooks/ghl
 * - Redirect URL: https://tu-dominio.com/api/webhooks/ghl (para OAuth callback)
 * 
 * Variables de entorno necesarias:
 * - WEBHOOK_PUBLIC_KEY: Clave pública de GHL para verificar firmas (opcional)
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener la instancia del SDK
    const ghlApp = GHLApp.getInstance();
    const ghl = ghlApp.getSDK();
    
    // Asegurar que MongoDB esté inicializado
    await ghlApp.initialize();

    // Parsear el body del webhook
    const body = await request.json();
    
    // Obtener la firma del header (GHL usa x-wh-signature)
    const signature = request.headers.get('x-wh-signature') || '';
    const publicKey = process.env.WEBHOOK_PUBLIC_KEY || '';

    console.log('GHL Webhook recibido:', {
      type: body.type,
      appId: body.appId,
      companyId: body.companyId,
      locationId: body.locationId,
      timestamp: new Date().toISOString()
    });

    // Verificar que el appId coincida (según lógica del SDK)
    const clientId = config.ghlApp.appId;
    const expectedAppId = clientId ? clientId.split('-')[0] : '';
    
    if (expectedAppId && body.appId !== expectedAppId) {
      console.warn('App ID mismatch, skipping webhook processing', {
        expected: expectedAppId,
        received: body.appId
      });
      return NextResponse.json({ 
        success: false, 
        error: 'App ID mismatch' 
      }, { status: 400 });
    }

    // Verificar la firma del webhook si está disponible
    let isSignatureValid = false;
    let skippedSignatureVerification = false;

    if (signature && publicKey) {
      try {
        const payload = JSON.stringify(body);
        isSignatureValid = ghl.webhooks.verifySignature(payload, signature, publicKey);
        
        if (!isSignatureValid) {
          console.warn('Invalid webhook signature');
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
        console.log('Webhook signature verified successfully');
      } catch (sigError) {
        console.error('Error verifying signature:', sigError);
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 401 }
        );
      }
    } else {
      console.warn('Skipping signature verification - missing signature or public key');
      skippedSignatureVerification = true;
    }

    // Procesar eventos INSTALL y UNINSTALL según la lógica del SDK
    const { companyId, locationId } = body;

    if (body.type === 'INSTALL') {
      console.log('Procesando evento INSTALL...', { companyId, locationId });
      
      if (companyId && locationId) {
        try {
          // El SDK genera el token de location usando el token de company almacenado
          // Esto requiere que el token de company ya esté almacenado (vía OAuth callback)
          const locationTokenResponse = await ghl.oauth.getLocationAccessToken({
            companyId,
            locationId,
          });

          console.log('Location access token generado y almacenado en MongoDB');
          console.log('INSTALL procesado exitosamente para location:', locationId);

          return NextResponse.json({ 
            success: true, 
            message: 'Install event processed successfully',
            companyId,
            locationId,
            isSignatureValid,
            skippedSignatureVerification
          });
        } catch (error: any) {
          console.error('Error procesando INSTALL:', error);
          
          // Si no hay token de company, el SDK no puede generar el token de location
          if (error.message?.includes('token') || error.message?.includes('not found')) {
            return NextResponse.json(
              { 
                success: false,
                error: 'Company token not found. Please complete OAuth flow first.',
                hint: 'The company must authorize the app via OAuth before installation can complete.'
              },
              { status: 400 }
            );
          }

          return NextResponse.json(
            { 
              success: false,
              error: 'Failed to process INSTALL event',
              details: error.message 
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'Missing companyId or locationId in INSTALL event' 
          },
          { status: 400 }
        );
      }
    }
    
    if (body.type === 'UNINSTALL') {
      console.log('Procesando evento UNINSTALL...', { companyId, locationId });
      
      if (locationId || companyId) {
        try {
          // El SDK elimina la sesión del sessionStorage
          // Usamos locationId si está disponible, sino companyId
          const resourceId = locationId || companyId;
          
          // Eliminar la sesión del sessionStorage explícitamente
          const sessionStorage = ghlApp.getSessionStorage();
          const deleted = await sessionStorage.deleteSession(resourceId);
          
          console.log('UNINSTALL procesado. Tokens eliminados de MongoDB para:', resourceId, 'deleted:', deleted);

          return NextResponse.json({ 
            success: true, 
            message: 'Uninstall event processed successfully',
            companyId,
            locationId,
            resourceId,
            deleted,
            isSignatureValid,
            skippedSignatureVerification
          });
        } catch (error: any) {
          console.error('Error procesando UNINSTALL:', error);
          return NextResponse.json(
            { 
              success: false,
              error: 'Failed to process UNINSTALL event',
              details: error.message 
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'Missing companyId or locationId in UNINSTALL event' 
          },
          { status: 400 }
        );
      }
    }

    // Si es otro tipo de evento, simplemente confirmamos recepción
    console.log('Evento no manejado:', body.type);
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received',
      type: body.type,
      isSignatureValid,
      skippedSignatureVerification
    });

  } catch (error) {
    console.error('Error procesando webhook de GHL:', error);
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

// También soportamos GET para verificación de salud del endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'GHL Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

