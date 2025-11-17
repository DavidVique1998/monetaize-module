import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { generateToken } from '@/lib/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/tokens - Listar todos los usuarios para generar tokens
 * Solo accesible para usuarios ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionManager.getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea ADMIN
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Obtener todos los usuarios con su información
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        ghlLocationId: true,
        ghlLocationName: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
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

/**
 * POST /api/admin/tokens - Generar un token JWT para un usuario
 * Solo accesible para usuarios ADMIN
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionManager.getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea ADMIN
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Obtener información del usuario
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        ghlLocationId: true,
        ghlLocationName: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generar token JWT
    const token = generateToken(targetUser.id, targetUser.ghlLocationId);

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          ghlLocationId: targetUser.ghlLocationId,
          ghlLocationName: targetUser.ghlLocationName,
        },
      },
    });
  } catch (error) {
    console.error('Error generating token:', error);
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

