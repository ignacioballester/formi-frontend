"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { isUserAuthorized } from '@/lib/api-iam'; // Assuming lib/iam.ts is in '@/lib'

interface UsePermissionOptions {
  resourceName: string;
  scopes: string[];
  skip?: boolean; // Optional flag to skip fetching permission
}

interface UsePermissionResult {
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>; // Changed to async to allow await for update
}

export function usePermission({
  resourceName,
  scopes,
  skip = false,
}: UsePermissionOptions): UsePermissionResult {
  const { data: session, status, update } = useSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(!skip && status !== "authenticated"); // Start loading if not skipping and not already authenticated
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0); // Renamed from triggerFetch for clarity

  const checkAccess = useCallback(async (isManualRefetch: boolean) => {
    if (skip && !isManualRefetch) {
      setIsLoading(false);
      setHasPermission(null);
      setError(null);
      return;
    }

    if (status === 'loading' && !isManualRefetch && fetchCount === 0) {
        setIsLoading(true);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isManualRefetch) {
        await update();
      }

      if (status !== 'authenticated' || !session?.accessToken) {
        setHasPermission(false);
        setError(status === 'unauthenticated' ? "User is unauthenticated." : "Access token not available or session invalid after refresh.");
        setIsLoading(false);
        return;
      }
      
      const authorized = await isUserAuthorized(
        session.accessToken,
        resourceName,
        scopes
      );
      setHasPermission(authorized);
    } catch (e: any) {
      console.error("Error in usePermission checkAccess:", e);
      setHasPermission(false);
      setError(e.message || "Failed to check permission.");
    } finally {
      setIsLoading(false);
    }
  }, [skip, status, session, resourceName, scopes, fetchCount]);

  const refetch = useCallback(async () => {
    setFetchCount(prev => prev + 1);
    await checkAccess(true);
  }, [checkAccess]);

  useEffect(() => {
    checkAccess(false);
  }, [checkAccess]);

  return { hasPermission, isLoading, error, refetch };
} 