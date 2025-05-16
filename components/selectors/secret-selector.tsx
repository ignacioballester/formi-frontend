"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { listSecretsAction } from "@/app/actions/secrets/actions";
import { type SecretResponse, type SecretIdentifier } from "@/lib/api-core";

interface SecretSelectorProps {
  organizationId: string | number;
  currentSecretName?: string | null; // Current secret name to pre-select
  onSecretChange: (secretIdentifier: SecretIdentifier | null) => void;
  getClientToken: () => Promise<string>;
  disabled?: boolean;
  triggerClassName?: string;
}

export function SecretSelector({
  organizationId,
  currentSecretName,
  onSecretChange,
  getClientToken,
  disabled = false,
  triggerClassName
}: SecretSelectorProps) {
  const [availableSecrets, setAvailableSecrets] = useState<SecretResponse[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(true);
  const [selectedSecretValue, setSelectedSecretValue] = useState<string | undefined>(currentSecretName || undefined);

  const fetchSecrets = useCallback(async () => {
    if (!organizationId) return;
    setIsLoadingSecrets(true);
    try {
      const token = await getClientToken();
      const orgId = Number(organizationId);
      const secretsResult = await listSecretsAction(token, orgId);
      if (secretsResult.success && secretsResult.data) {
        setAvailableSecrets(secretsResult.data);
        // If currentSecretName is provided and exists in the fetched list, ensure it's selected
        if (currentSecretName && secretsResult.data.some(s => s.name === currentSecretName)) {
          setSelectedSecretValue(currentSecretName);
        } else if (secretsResult.data.length > 0 && !currentSecretName) {
          // Optionally, auto-select the first one if no currentSecretName and list is not empty
          // setSelectedSecretValue(secretsResult.data[0].name);
          // onSecretChange(secretsResult.data[0] ? { name: secretsResult.data[0].name, type: secretsResult.data[0].type, organization_id: secretsResult.data[0].organization_id, project_id: secretsResult.data[0].project_id } : null);
          setSelectedSecretValue(undefined); // Or keep it unselected
        } else if (!currentSecretName) {
            setSelectedSecretValue(undefined);
        }

      } else {
        toast({
          title: "Error Fetching Secrets",
          description: secretsResult.error || "Could not load secrets for selection.",
          variant: "destructive",
        });
        setAvailableSecrets([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch secrets.",
        variant: "destructive",
      });
      setAvailableSecrets([]);
    } finally {
      setIsLoadingSecrets(false);
    }
  }, [organizationId, getClientToken, currentSecretName]);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  // Effect to update selectedValue if currentSecretName prop changes externally
  useEffect(() => {
    setSelectedSecretValue(currentSecretName || undefined);
  }, [currentSecretName]);

  const handleValueChange = (value: string) => {
    setSelectedSecretValue(value);
    const selected = availableSecrets.find(s => s.name === value);
    if (selected) {
      onSecretChange({
        name: selected.name,
        type: selected.type,
        organization_id: selected.organization_id,
        project_id: selected.project_id ?? undefined,
      });
    } else {
      onSecretChange(null); // Or handle as an error/reset
    }
  };

  if (isLoadingSecrets) {
    return <Skeleton className={`h-10 w-full ${triggerClassName || ''}`} />;
  }

  return (
    <Select
      value={selectedSecretValue}
      onValueChange={handleValueChange}
      disabled={disabled || availableSecrets.length === 0}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={availableSecrets.length === 0 ? "No secrets available" : "Select a secret"} />
      </SelectTrigger>
      <SelectContent>
        {availableSecrets.length > 0 ? (
          availableSecrets.map((secret) => (
            <SelectItem key={secret.name} value={secret.name}>
              {secret.display_name || secret.name} ({secret.type})
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-secrets" disabled>
            No secrets found for this organization
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
} 