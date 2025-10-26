import { NextRequest, NextResponse } from 'next/server';
import { RetellService } from '@/lib/retell';

export async function GET(request: NextRequest) {
  try {
    const agents = await RetellService.getAgents();
    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    console.error('Error in agents API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agent = await RetellService.createAgent(body);
    return NextResponse.json({ success: true, data: agent });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
