import { NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { RetellSyncService } from '@/lib/retell-sync';
import { RetellService } from '@/lib/retell';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ agentId: string }> | { agentId: string } }
) {
  const resolvedParams = await params;
  const agentId = typeof resolvedParams.agentId === 'string' ? resolvedParams.agentId : String(resolvedParams.agentId);

  try {
    const user = await SessionManager.requireAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const agentExists = await RetellSyncService.verifyAgentOwnership(user.id, agentId);
    if (!agentExists) {
      return NextResponse.json(
        { success: false, error: 'Agent not found or does not belong to your account' },
        { status: 404 }
      );
    }

    const versions = await RetellService.getAgentVersions(agentId);
    return NextResponse.json({ success: true, data: versions });
  } catch (error: any) {
    console.error('Error fetching agent versions:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}


