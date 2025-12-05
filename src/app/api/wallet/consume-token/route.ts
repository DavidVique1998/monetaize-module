import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { consumeCredits, getOrCreateWallet } from '@/lib/wallet';
import { z } from 'zod';

const consumeSchema = z.object({
  // amount en centavos (entero positivo)
  amount: z.number().positive(),
  reason: z.string().min(1, 'El motivo del consumo es requerido'),
  metricType: z.string().optional(),
  metricValue: z.number().optional(),
  conversationId: z.string().optional(),
});

/**
 * POST /api/wallet/consume-token - Consumir créditos usando token JWT
 * Endpoint público que requiere autenticación mediante JWT
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

    // El endpoint recibe amount en centavos, pasarlo directamente sin conversión
    // Obtener wallet del usuario desde el token
    const wallet = await getOrCreateWallet(payload.userId);

    // Consumir créditos (amount ya viene en centavos)
    const result = await consumeCredits({
      walletId: wallet.id,
      amount: validatedData.amount, // Ya está en centavos
      metricType: validatedData.metricType,
      metricValue: validatedData.metricValue,
      description: validatedData.reason, // Usar 'reason' como description
      conversationId: validatedData.conversationId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Error al consumir créditos',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance: result.newBalance,
        transactionId: result.transactionId,
        userId: payload.userId,
        ghlLocationId: payload.ghlLocationId,
      },
    });
  } catch (error) {
    console.error('Error consuming credits with token:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
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

