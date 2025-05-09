"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { isUserAuthorized } from '@/lib/iam'; // Assuming lib/iam.ts is in '@/lib'

interface UsePermissionOptions {
  resourceName: string;
  scopes: string[];
  skip?: boolean; // Optional flag to skip fetching permission
}

interface UsePermissionResult {
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void; // Allow manual refetching
}

export function usePermission({
  resourceName,
  scopes,
  skip = false,
}: UsePermissionOptions): UsePermissionResult {
  const { data: session, status } = useSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(!skip && status !== "authenticated"); // Start loading if not skipping and not already authenticated
  const [error, setError] = useState<string | null>(null);
  const [triggerFetch, setTriggerFetch] = useState(0); // To manually trigger refetch

  const refetch = () => {
    setTriggerFetch(prev => prev + 1);
  };

  useEffect(() => {
    async function checkAccess() {
      if (skip) {
        setIsLoading(false);
        setHasPermission(null); // Or a default based on your needs for skipped checks
        return;
      }

      if (status === 'loading') {
        setIsLoading(true);
        return;
      }

      if (status === 'unauthenticated') {
        setHasPermission(false);
        setIsLoading(false);
        setError("User is unauthenticated.");
        return;
      }
      
      if (!session?.accessToken) {
        setHasPermission(false);
        setIsLoading(false);
        setError("Access token not available.");
        return;
      }
      
      // Clear previous error before new fetch
      setError(null);
      setIsLoading(true);
      try {
        const authorized = await isUserAuthorized(
          resourceName,
          scopes,
          session.accessToken
        );
        setHasPermission(authorized);
      } catch (e: any) {
        console.error("Error in usePermission checkAccess:", e);
        setHasPermission(false); // Default to no access on error
        setError(e.message || "Failed to check permission.");
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [session, status, resourceName, scopes, skip, triggerFetch]); // JSON.stringify(scopes) if scopes array identity can change frequently

  return { hasPermission, isLoading, error, refetch };
} 