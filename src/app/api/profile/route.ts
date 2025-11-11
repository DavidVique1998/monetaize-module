import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Endpoint para actualizar el perfil del usuario
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await SessionManager.requireAuth();
    const body = await request.json();

    const { name, email } = body;

    // Validar email
    if (email && !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        ghlLocationId: true,
        ghlCompanyId: true,
        ghlLocationName: true,
        ghlLocationAddress: true,
        ghlLocationCity: true,
        ghlLocationState: true,
        ghlLocationPhone: true,
        ghlLocationEmail: true,
        ghlLocationWebsite: true,
        ghlLocationTimezone: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Si es un error de autenticación
    if (errorMessage === 'Unauthorized') {
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

