import { NextRequest, NextResponse } from 'next/server';
import { GHLApp } from '@/lib/ghlApp';

export async function GET(request: NextRequest) {
  try {
    const ghlApp = GHLApp.getInstance();
    // Asegurar que MongoDB esté inicializado antes de obtener locations
    await ghlApp.initialize();
    const locations = await ghlApp.getLocations();
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error('Error in locations API:', error);
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

