import { NextResponse } from 'next/server';
import { getRepositories as getRepositoriesFromServer } from '@/lib/api'; // Alias
import { getAppServerSession } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } } // id here is the organization_id
) {
  try {
    const session = await getAppServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = Number.parseInt(params.id);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    // The original getRepositories expects an object like { organization_id: number }
    const repositories = await getRepositoriesFromServer({ organization_id: organizationId });

    return NextResponse.json(repositories);

  } catch (error) {
    console.error('[API /api/organizations/[id]/repositories] Error fetching repositories:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 