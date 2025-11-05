import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Verificar que tenemos la API key de Retell
    if (!config.retell.apiKey) {
      return NextResponse.json(
        { error: 'Retell API key not configured' },
        { status: 500 }
      );
    }

    // Retornar la configuración necesaria para el cliente web
    // Nota: En producción, podrías querer generar un token temporal
    return NextResponse.json({
      apiKey: config.retell.apiKey,
      baseUrl: config.retell.baseUrl,
    });
  } catch (error) {
    console.error('Error getting Retell config:', error);
    return NextResponse.json(
      { error: 'Failed to get Retell configuration' },
      { status: 500 }
    );
  }
}
