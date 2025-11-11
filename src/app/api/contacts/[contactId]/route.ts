import { NextRequest, NextResponse } from 'next/server';
import { getGHLContext, getGHLLocationId } from '@/lib/ghl';

/**
 * Endpoint para obtener un contacto específico de GHL
 * 
 * Usa el helper getGHLContext() que obtiene el locationId desde los headers
 * agregados por el middleware, haciendo el código mucho más simple.
 * 
 * Ejemplo de uso:
 * GET /api/contacts/ocQHyuzHvysMo5N5VsXc
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> | { contactId: string } }
) {
  try {
    // Obtener contactId de los parámetros
    const resolvedParams = await Promise.resolve(params);
    const contactId = resolvedParams.contactId;

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Obtener contexto de GHL directamente desde los headers del middleware
    // El middleware ya agregó el locationId a los headers
    const ghl = await getGHLContext(request);

    // Llamar API - el locationId ya está configurado internamente
    // El método getContact() usa automáticamente el locationId configurado
    const contact = await ghl.getContact(contactId);

    return NextResponse.json({ 
      success: true, 
      data: contact,
      userLocationId: getGHLLocationId(request)
    });
  } catch (error) {
    console.error('Error in contacts API:', error);
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

