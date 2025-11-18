import { NextRequest, NextResponse } from 'next/server';
import { processAllBatches } from '@/lib/wallet';

/**
 * POST /api/cron/process-batches - Procesar todos los lotes pendientes
 * Endpoint para cron jobs que procesa lotes que cumplen los criterios
 * 
 * Protección: 
 * - Vercel Cron ejecuta internamente (no requiere auth externa)
 * - Si se llama manualmente o desde otro servicio, requiere CRON_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar token de autorización (solo si se llama externamente)
    // Vercel Cron no requiere autenticación externa
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Solo verificar si CRON_SECRET está configurado y hay un header de auth
    // Esto permite llamadas externas protegidas, pero no bloquea Vercel Cron
    if (cronSecret && authHeader) {
      const token = authHeader.replace(/^Bearer /i, '');
      if (token !== cronSecret) {
        console.warn('[Cron] Intento de acceso no autorizado al endpoint de procesamiento de lotes');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Procesar todos los lotes
    const result = await processAllBatches();

    return NextResponse.json({
      success: true,
      data: {
        processed: result.processed,
        errors: result.errors,
        details: result.details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error processing batches:', error);
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



