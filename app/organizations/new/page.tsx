"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { createOrganization } from "@/lib/api"

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Organization name must be at least 3 characters." })
    .max(50, { message: "Organization name must not exceed 50 characters." }),
  description: z.string().max(200, { message: "Description must not exceed 200 characters." }).optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function NewOrganizationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  // Handle form submission using the imported API function
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      // Prepare data, ensuring description is handled if optional
      const organizationData = {
        name: data.name,
        description: data.description || "", // Ensure description is always a string
      };

      // Call the correct API function
      const organization = await createOrganization(organizationData);

      toast({
        title: "Organization created",
        description: `${organization.name} has been successfully created.`,
      })

      router.push("/organizations")
      router.refresh() // Consider if refresh is needed, might cause reload

    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error creating organization",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ml-72 flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/organizations">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Create Organization</h2>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            New Organization
          </CardTitle>
          <CardDescription>Create a new organization to manage projects, modules, and deployments.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization name" {...field} />
                    </FormControl>
                    <FormDescription>This is the name that will be displayed throughout the platform.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this organization"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Provide a brief description of the organization's purpose.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/organizations">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Organization"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
