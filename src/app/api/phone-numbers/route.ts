import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function GET(request: NextRequest) {
  try {
    const phoneNumbers = await RetellService.getPhoneNumbers();
    return NextResponse.json({ success: true, data: phoneNumbers });
  } catch (error) {
    console.error('Error in phone numbers API:', error);
    
    // Obtener el mensaje de error completo
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
    const body = await request.json();
    const phoneNumber = await RetellService.importPhoneNumber(body);
    return NextResponse.json({ success: true, data: phoneNumber });
  } catch (error) {
    console.error('Error importing phone number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import phone number' },
      { status: 500 }
    );
  }
}
