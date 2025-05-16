import { NextResponse } from 'next/server';
import { getOrganizations } from '@/lib/api-core';
import { getAppServerSession } from '@/lib/auth-server'; // To check session

export async function GET() {
  try {
    // Optional: Check for session before fetching, though getOrganizations will handle token
    const session = await getAppServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const organizations = await getOrganizations(); // This will use getServerToken internally
    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error('[API /api/organizations] Error fetching organizations:', error);
    // ApiTokenExpiredError and TokenRefreshFailedError from api-retry will be caught here
    // as will generic errors from fetchAPIInternal.
    
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error.message.includes('Unauthorized') || error.message.includes('Authentication failed')) {
        errorMessage = 'Authentication failed';
        statusCode = 401;
    } else if (error.name === 'ApiTokenExpiredError' || error.name === 'TokenRefreshFailedError') {
        errorMessage = 'Session expired or token refresh failed. Please log in again.';
        statusCode = 401; // Or 498 if you want to be specific, but 401 is fine for client
    }
    // You can add more specific error handling here if needed

    return NextResponse.json({ message: errorMessage, error: error.message }, { status: statusCode });
  }
} 