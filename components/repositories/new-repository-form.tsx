"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { createRepository, CreateRepositoryInput, Organization } from "@/lib/api"
import { RepositoryFormFields, repositoryFormSchema, RepositoryFormValues } from "@/components/forms/repository-form-fields"

interface NewRepositoryFormProps {
  organization: Organization
  getClientToken: () => Promise<string>
  onSuccess?: (newRepositoryId: number) => void // Callback on successful creation
}

export function NewRepositoryForm({ organization, getClientToken, onSuccess }: NewRepositoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RepositoryFormValues>({
    resolver: zodResolver(repositoryFormSchema),
    defaultValues: {
      repositoryName: "",
      repositoryUrl: "",
      secretIdentifier: undefined, // Or null, depending on how SecretSelector handles empty state
    },
  })

  const onSubmit = async (data: RepositoryFormValues) => {
    setIsSubmitting(true)
    try {
      const token = await getClientToken()
      const repositoryData: CreateRepositoryInput = {
        name: data.repositoryName,
        url: data.repositoryUrl,
        organization_id: organization.id,
        secret: data.secretIdentifier,
      }

      const newRepo = await createRepository(repositoryData, async () => token)

      toast({
        title: "Repository created",
        description: `${newRepo.name} has been successfully created.`,
      })

      if (onSuccess) {
        onSuccess(newRepo.id)
      } else {
        // Default navigation if no onSuccess callback is provided
        router.push(`/organizations/${organization.id}/repositories`)
      }
      router.refresh() // Refresh data on the target page
    } catch (error) {
      console.error("Error creating repository:", error)
      toast({
        title: "Error creating repository",
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
            <CardTitle>New Repository Details</CardTitle>
            <CardDescription>Enter the details for the new repository in {organization.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <RepositoryFormFields
              form={form}
              organizationId={organization.id.toString()} // SecretSelector expects string
              getClientToken={getClientToken}
              isSubmitting={isSubmitting}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Creating..." : "Create Repository"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
} 