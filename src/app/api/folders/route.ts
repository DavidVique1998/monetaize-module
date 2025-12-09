import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createFolderSchema = z.object({
  name: z.string().min(1, 'El nombre de la carpeta es requerido'),
});

/**
 * GET /api/folders
 * Obtener todas las carpetas del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const folders = await prisma.folder.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { agents: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      success: true, 
      data: folders.map(folder => ({
        ...folder,
        agentCount: folder._count.agents
      }))
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/folders
 * Crear una nueva carpeta
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createFolderSchema.parse(body);

    // Verificar que no exista una carpeta con el mismo nombre para este usuario
    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId: user.id,
        name: validatedData.name.trim(),
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una carpeta con ese nombre' },
        { status: 400 }
      );
    }

    const folder = await prisma.folder.create({
      data: {
        name: validatedData.name.trim(),
        userId: user.id,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: { ...folder, agentCount: 0 }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}




