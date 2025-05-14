import { NextResponse } from 'next/server';
import { getDeployments as getDeploymentsFromServer } from '@/lib/api'; // Alias
import { getAppServerSession } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } } // Parameter name changed to projectId
) {
  try {
    const session = await getAppServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectIdNumber = Number.parseInt(params.projectId);
    if (isNaN(projectIdNumber)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const deployments = await getDeploymentsFromServer(projectIdNumber);

    return NextResponse.json(deployments);

  } catch (error) {
    console.error('[API /api/projects/[projectId]/deployments] Error fetching deployments:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 