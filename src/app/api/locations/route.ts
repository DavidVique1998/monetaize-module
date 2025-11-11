import { NextRequest, NextResponse } from 'next/server';
import { getGHLContext, getGHLLocationId } from '@/lib/ghl';

/**
 * Endpoint para obtener locations de GHL
 * 
 * Usa el helper getGHLContext() que obtiene el locationId desde los headers
 * agregados por el middleware, haciendo el código mucho más simple.
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener contexto de GHL directamente desde los headers del middleware
    // El middleware ya agregó el locationId a los headers
    const ghl = await getGHLContext(request);

    // Llamar API - el locationId ya está configurado
    // El SDK automáticamente:
    // - Busca en MongoDB: { resourceId: locationId }
    // - Encuentra el token guardado durante OAuth callback
    // - Usa ese token para autenticar la llamada
    const location = await ghl.getLocation();

    return NextResponse.json({ 
      success: true, 
      data: location,
      userLocationId: getGHLLocationId(request)
    });
  } catch (error) {
    console.error('Error in locations API:', error);
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

