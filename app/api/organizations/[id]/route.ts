import { NextResponse } from 'next/server';
import { getOrganization as getOrganizationFromServer } from '@/lib/api-core'; // Alias to avoid naming conflict
import { getAppServerSession } from '@/lib/auth-server'; // For authentication/authorization if needed by getOrganizationFromServer

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Assuming getOrganizationFromServer might need the session or performs its own auth checks
    const organization = await getOrganizationFromServer(organizationId); 

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('[API /api/organizations/[id]] Error fetching organization:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 