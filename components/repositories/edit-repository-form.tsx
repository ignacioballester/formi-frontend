"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { Repository, UpdateRepositoryInput } from "@/lib/api"
import { updateRepositoryAction } from "@/app/actions/repositories/actions" // Assuming this action exists and is appropriate
import { RepositoryFormFields, repositoryFormSchema, RepositoryFormValues } from "@/components/forms/repository-form-fields"

interface EditRepositoryFormProps {
  organizationId: string // Passed for SecretSelector and context
  repository: Repository
  getClientToken: () => Promise<string>
  onSuccess?: (updatedRepository: Repository) => void // Callback on successful update
}

export function EditRepositoryForm({
  organizationId,
  repository,
  getClientToken,
  onSuccess,
}: EditRepositoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RepositoryFormValues>({
    resolver: zodResolver(repositoryFormSchema),
    defaultValues: {
      repositoryName: repository.name || "",
      repositoryUrl: repository.url || "",
      secretIdentifier: repository.secret || undefined, // Pre-fill with existing secret
    },
  })

  useEffect(() => {
    // Reset form if the repository prop changes
    form.reset({
      repositoryName: repository.name || "",
      repositoryUrl: repository.url || "",
      secretIdentifier: repository.secret || undefined,
    })
  }, [repository, form])

  const onSubmit = async (data: RepositoryFormValues) => {
    setIsSubmitting(true)
    try {
      const token = await getClientToken()
      const updateData: UpdateRepositoryInput = {}

      if (data.repositoryName !== repository.name) {
        updateData.name = data.repositoryName
      }
      if (data.repositoryUrl !== repository.url) {
        updateData.url = data.repositoryUrl
      }
      // Ensure we handle null/undefined from form if schema allows, vs actual SecretIdentifier object
      const currentSecretString = JSON.stringify(repository.secret || null)
      const newSecretString = JSON.stringify(data.secretIdentifier || null)

      if (newSecretString !== currentSecretString) {
         // If secretIdentifier is null/undefined, it means user wants to remove it (if API supports)
         // If it's an object, it's a new/changed secret.
         // The `UpdateRepositoryInput` expects `SecretIdentifier | undefined`.
         updateData.secret = data.secretIdentifier || undefined;
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No Changes",
          description: "There are no changes to save.",
        })
        setIsSubmitting(false)
        return
      }

      const result = await updateRepositoryAction(repository.id, updateData, token)

      if (result.success && result.data) {
        toast({
          title: "Repository Updated",
          description: `${result.data.name} has been successfully updated.`,
        })
        if (onSuccess) {
          onSuccess(result.data)
        } else {
            router.refresh() // Refresh current page or navigate if needed
        }
      } else {
        throw new Error(result.error || "Failed to update repository.")
      }
    } catch (error) {
      console.error("Error updating repository:", error)
      toast({
        title: "Error updating repository",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Edit Repository: {repository.name}</CardTitle>
            <CardDescription>Update the details for this repository.</CardDescription>
          </CardHeader>
          <CardContent>
            <RepositoryFormFields
              form={form}
              organizationId={organizationId} // Ensure this is a string
              getClientToken={getClientToken}
              isSubmitting={isSubmitting}
              currentSecretName={repository.secret?.name} // Pass current secret name for display
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
} 