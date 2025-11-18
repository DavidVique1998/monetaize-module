import { NextRequest, NextResponse } from 'next/server';
import { processAllBatches } from '@/lib/wallet';

/**
 * POST /api/cron/process-batches - Procesar todos los lotes pendientes
 * Endpoint para cron jobs que procesa lotes que cumplen los criterios
 * 
 * Protección: Debe estar protegido con un token secreto o IP whitelist
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar token de autorización (opcional pero recomendado)
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret) {
      const token = authHeader?.replace('Bearer ', '');
      if (token !== cronSecret) {
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



