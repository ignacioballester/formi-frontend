"use client"

import { UseFormReturn } from "react-hook-form"
import * as z from "zod"

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SecretSelector } from "@/components/selectors/secret-selector"
import { SecretIdentifier } from "@/lib/api-core"

// Schema for the form fields, can be extended by parent components
export const repositoryFormSchema = z.object({
  repositoryName: z
    .string()
    .min(3, { message: "Repository name must be at least 3 characters." })
    .max(100, { message: "Repository name must not exceed 100 characters." }),
  repositoryUrl: z.string().url({ message: "Please enter a valid URL." }),
  secretIdentifier: z.custom<SecretIdentifier>((val) => {
    // Check if val is an object and has the necessary properties of SecretIdentifier
    return typeof val === 'object' && val !== null && 'name' in val && 'organization_id' in val && 'type' in val;
  }, {
    message: "A valid secret must be selected.",
  })
})

export type RepositoryFormValues = z.infer<typeof repositoryFormSchema>

interface RepositoryFormFieldsProps {
  form: UseFormReturn<RepositoryFormValues> // Use the specific form values type
  organizationId: string 
  getClientToken: () => Promise<string>
  isSubmitting?: boolean
  currentSecretName?: string // Optional: for edit mode to show current secret in selector
}

export function RepositoryFormFields({
  form,
  organizationId,
  getClientToken,
  isSubmitting,
  currentSecretName,
}: RepositoryFormFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="repositoryName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Repository Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., my-awesome-service" {...field} disabled={isSubmitting} />
            </FormControl>
            <FormDescription>A descriptive name for your repository.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="repositoryUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Repository URL</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://github.com/my-org/my-repo.git" {...field} disabled={isSubmitting} />
            </FormControl>
            <FormDescription>The Git URL of the repository (e.g., HTTPS or SSH).</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="secretIdentifier"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Repository Secret</FormLabel>
            <FormControl>
              <SecretSelector
                organizationId={organizationId}
                currentSecretName={field.value?.name || currentSecretName} // Use field value or passed current name
                onSecretChange={(secretId) => field.onChange(secretId)}
                getClientToken={getClientToken}
                disabled={isSubmitting}
                triggerClassName="w-full"
              />
            </FormControl>
            <FormDescription>
              Select a secret associated with this repository. This is often used for private repositories.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 