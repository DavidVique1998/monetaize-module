import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { addPendingConsumption, getOrCreateWallet, processBatch } from '@/lib/wallet';
import { z } from 'zod';

const consumeSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1, 'El motivo del consumo es requerido'),
  metricType: z.string().optional(),
  metricValue: z.number().optional(),
  conversationId: z.string().optional(),
});

/**
 * POST /api/wallet/consume-batch - Acumular consumo de créditos (procesamiento por lotes)
 * Endpoint público que requiere autenticación mediante JWT
 * Este endpoint acumula consumos y los procesa cuando se alcanzan los umbrales configurados
 */
export async function POST(request: NextRequest) {
  try {
    // Extraer token del header Authorization
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token de autenticación requerido. Usa el header: Authorization: Bearer <token>' 
        },
        { status: 401 }
      );
    }

    // Verificar token JWT
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Validar datos del request
    const body = await request.json();
    const validatedData = consumeSchema.parse(body);

    // Obtener wallet del usuario desde el token
    const wallet = await getOrCreateWallet(payload.userId);

    // Agregar consumo pendiente (acumulación)
    const result = await addPendingConsumption({
      walletId: wallet.id,
      amount: validatedData.amount,
      metricType: validatedData.metricType,
      metricValue: validatedData.metricValue,
      description: validatedData.reason,
      conversationId: validatedData.conversationId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Error al acumular consumo',
        },
        { status: 400 }
      );
    }

    // Si se debe procesar inmediatamente (se alcanzó un umbral)
    let batchProcessed = false;
    let batchResult = null;

    if (result.shouldProcess) {
      batchResult = await processBatch(wallet.id);
      batchProcessed = batchResult.success;
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingId: result.pendingId,
        batchProcessed,
        ...(batchProcessed && batchResult ? {
          processedCount: batchResult.processedCount,
          totalAmount: batchResult.totalAmount,
          transactionId: batchResult.transactionId,
        } : {}),
        userId: payload.userId,
        ghlLocationId: payload.ghlLocationId,
      },
    });
  } catch (error) {
    console.error('Error accumulating consumption:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

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



