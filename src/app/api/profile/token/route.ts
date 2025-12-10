import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { generateToken } from '@/lib/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  response.headers.set('Vary', 'Origin');
  return response;
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/**
 * GET /api/profile/token?locationId=...
 * Obtiene (o genera la primera vez) el token persistente para la ubicación dada.
 * No requiere sesión pero valida la ubicación; el token se guarda en DB y no cambia.
 */
export async function GET(request: NextRequest) {
  try {
    const locationId =
      request.nextUrl.searchParams.get('locationId') ||
      request.headers.get('x-location-id') ||
      request.headers.get('location-id');

    if (!locationId) {
      return withCors(
        NextResponse.json({ success: false, error: 'locationId requerido' }, { status: 400 })
      );
    }

    const user = await prisma.user.findUnique({
      where: { ghlLocationId: locationId },
      select: {
        id: true,
        email: true,
        name: true,
        ghlLocationId: true,
        ghlCompanyId: true,
        ghlLocationName: true,
        apiToken: true,
      },
    });

    if (!user) {
      return withCors(
        NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
      );
    }

    let token = user.apiToken;

    if (!token) {
      token = generateToken(user.id, user.ghlLocationId, true);
      await prisma.user.update({
        where: { id: user.id },
        data: { apiToken: token },
      });
    }

    return withCors(
      NextResponse.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            ghlLocationId: user.ghlLocationId,
            ghlCompanyId: user.ghlCompanyId,
            ghlLocationName: user.ghlLocationName,
          },
        },
      })
    );
  } catch (error) {
    console.error('Error obtaining token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return withCors(
      NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    );
  }
}

/**
 * POST /api/profile/token - Generar u obtener token JWT del usuario autenticado
 * Ahora persiste el token en DB y reutiliza el mismo al solicitarlo de nuevo.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await SessionManager.requireAuth();

    // Obtener información completa del usuario desde la base de datos
    const fullUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        ghlLocationId: true,
        ghlCompanyId: true,
        ghlLocationName: true,
        apiToken: true,
      },
    });

    if (!fullUser) {
      return withCors(
        NextResponse.json(
          { success: false, error: 'Usuario no encontrado' },
          { status: 404 }
        )
      );
    }

    // El token debe ser estable: si ya existe, reutilizarlo
    let token = fullUser.apiToken;

    // Para garantizar que no caduque, siempre generamos como permanente
    const permanent = true;

    if (!token) {
      token = generateToken(fullUser.id, fullUser.ghlLocationId, permanent);
      await prisma.user.update({
        where: { id: fullUser.id },
        data: { apiToken: token },
      });
    }

    return withCors(
      NextResponse.json({
        success: true,
        data: {
          token,
          user: {
            id: fullUser.id,
            email: fullUser.email,
            name: fullUser.name,
            ghlLocationId: fullUser.ghlLocationId,
            ghlCompanyId: fullUser.ghlCompanyId,
            ghlLocationName: fullUser.ghlLocationName,
          },
        },
      })
    );
  } catch (error) {
    console.error('Error generating token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Si es un error de autenticación
    if (errorMessage === 'Unauthorized' || errorMessage.includes('No hay sesión activa')) {
      return withCors(
        NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: false,
          error: errorMessage
        },
        { status: 500 }
      )
    );
  }
}
