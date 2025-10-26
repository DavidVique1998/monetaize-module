import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function GET(request: NextRequest) {
  try {
    const voices = await RetellService.getVoices();
    return NextResponse.json({ success: true, data: voices });
  } catch (error) {
    console.error('Error in voices API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
