import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';

export async function GET(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener números telefónicos del usuario (solo los que pertenecen a su cuenta)
    const userPhoneNumbers = await RetellSyncService.getUserPhoneNumbers(user.id);
    
    return NextResponse.json({ success: true, data: userPhoneNumbers });
  } catch (error) {
    console.error('Error in phone numbers API:', error);
    
    // Si es error de autenticación
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('Full error details:', errorDetails);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionManager.requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Determinar si es crear (con area_code) o importar (con phone_number sin area_code)
    const isCreating = !!body.area_code;
    
    // Crear/importar número en Retell y vincularlo con el usuario
    const { retellPhone, localPhone } = await RetellSyncService.createPhoneNumberForUser(
      user.id,
      body,
      isCreating
    );
    
    return NextResponse.json({ 
      success: true, 
      data: retellPhone,
      localPhone: localPhone 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating/importing phone number:', error);
    console.error('Error stack:', error.stack);
    
    // Si es error de autenticación
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extraer mensaje de error más descriptivo
    let errorMessage = 'Failed to create/import phone number';
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error?.stack || error?.toString()
      },
      { status: 500 }
    );
  }
}
