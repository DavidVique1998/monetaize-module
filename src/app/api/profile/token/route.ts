import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { generateToken } from '@/lib/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/profile/token - Generar un token JWT para el usuario autenticado
 * Cualquier usuario autenticado puede generar su propio token
 * 
 * Body (opcional):
 * {
 *   permanent: boolean // Si es true, el token no expirará (por defecto false)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionManager.requireAuth();

    // Obtener información completa del usuario desde la base de datos
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        ghlLocationId: true,
        ghlLocationName: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Leer body para verificar si se solicita token permanente
    let permanent = false;
    try {
      // Verificar si hay contenido en el body
      const contentType = request.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const body = await request.json().catch(() => ({}));
        permanent = body.permanent === true;
      }
    } catch {
      // Si no hay body o es inválido, usar valor por defecto
      permanent = false;
    }

    // Generar token JWT para el usuario autenticado
    const token = generateToken(fullUser.id, fullUser.ghlLocationId, permanent);

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: fullUser.id,
          email: fullUser.email,
          name: fullUser.name,
          ghlLocationId: fullUser.ghlLocationId,
          ghlLocationName: fullUser.ghlLocationName,
        },
      },
    });
  } catch (error) {
    console.error('Error generating token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Si es un error de autenticación
    if (errorMessage === 'Unauthorized' || errorMessage.includes('No hay sesión activa')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

