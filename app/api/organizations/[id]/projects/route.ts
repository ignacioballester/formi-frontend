import { NextResponse } from 'next/server';
import { getProjects as getProjectsFromServer } from '@/lib/api'; // Alias to avoid naming conflict
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

    const projects = await getProjectsFromServer(organizationId);

    // getProjectsFromServer likely returns an array, even if empty. 
    // Add a specific check if it can return null/undefined for a valid scenario.
    // For now, assume it returns an array.
    return NextResponse.json(projects);

  } catch (error) {
    console.error('[API /api/organizations/[id]/projects] Error fetching projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 