import { NextRequest, NextResponse } from 'next/server';
import { checkAndProcessAutoRecharges } from '@/lib/stripe';
import { config } from '@/lib/config';

/**
 * Endpoint para ejecutar la verificación periódica de recargas automáticas
 * Este endpoint debe ser llamado por un cron job externo (Vercel Cron, GitHub Actions, etc.)
 * 
 * Seguridad: Requiere un token secreto en el header Authorization
 * 
 * Ejemplo de uso:
 * curl -X POST https://tu-dominio.com/api/cron/auto-recharge \
 *   -H "Authorization: Bearer TU_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con token secreto
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'change-this-secret-in-production';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing or invalid authorization header' 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    
    if (token !== cronSecret) {
      console.warn('[Cron] Intento de acceso no autorizado al endpoint de recarga automática');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid authorization token' 
        },
        { status: 403 }
      );
    }

    console.log('[Cron] Iniciando verificación de recargas automáticas...');
    const startTime = Date.now();

    // Ejecutar la verificación de recargas automáticas
    const result = await checkAndProcessAutoRecharges();

    const duration = Date.now() - startTime;
    console.log(`[Cron] Verificación de recargas automáticas completada en ${duration}ms`);
    console.log(`[Cron] Resultados: ${result.processed} procesadas, ${result.skipped} omitidas, ${result.errors} errores`);

    return NextResponse.json({
      success: true,
      message: 'Auto-recharge check completed successfully',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      results: {
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors,
        details: result.details,
      },
    });
  } catch (error: any) {
    console.error('[Cron] Error ejecutando verificación de recargas automáticas:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error ejecutando verificación de recargas automáticas',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para verificar que el cron job está configurado correctamente
 * Útil para testing y monitoreo
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Auto-recharge cron endpoint is active',
    instructions: {
      method: 'POST',
      auth: 'Bearer token required in Authorization header',
      envVar: 'Set CRON_SECRET environment variable',
    },
    timestamp: new Date().toISOString(),
  });
}

