import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateFolderSchema = z.object({
  name: z.string().min(1, 'El nombre de la carpeta es requerido').optional(),
});

/**
 * PATCH /api/folders/[folderId]
 * Actualizar una carpeta
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> | { folderId: string } }
) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const folderId = typeof resolvedParams.folderId === 'string' 
      ? resolvedParams.folderId 
      : String(resolvedParams.folderId);

    // Verificar que la carpeta pertenece al usuario
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateFolderSchema.parse(body);

    // Si se está cambiando el nombre, verificar que no exista otra carpeta con ese nombre
    if (validatedData.name && validatedData.name.trim() !== folder.name) {
      const existingFolder = await prisma.folder.findFirst({
        where: {
          userId: user.id,
          name: validatedData.name.trim(),
          id: { not: folderId },
        },
      });

      if (existingFolder) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una carpeta con ese nombre' },
          { status: 400 }
        );
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: validatedData.name ? { name: validatedData.name.trim() } : {},
      include: {
        _count: {
          select: { agents: true }
        }
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updatedFolder,
        agentCount: updatedFolder._count.agents
      }
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/folders/[folderId]
 * Eliminar una carpeta (los agentes se moverán a sin carpeta)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> | { folderId: string } }
) {
  try {
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const folderId = typeof resolvedParams.folderId === 'string' 
      ? resolvedParams.folderId 
      : String(resolvedParams.folderId);

    // Verificar que la carpeta pertenece al usuario
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la carpeta (los agentes se moverán automáticamente a null por onDelete: SetNull)
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}




