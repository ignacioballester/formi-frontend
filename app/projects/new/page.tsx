"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers3, ArrowLeft, Building } from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { type Organization, getOrganizations, createProject, type CreateProjectInput } from "@/lib/api-core";

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Project name must be at least 3 characters." })
    .max(50, { message: "Project name must not exceed 50 characters." }),
  organizationId: z.string().min(1, { message: "Please select an organization." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewGlobalProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const [initialOrgId, setInitialOrgId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      organizationId: "",
    },
  });

  const getClientToken = useCallback(async () => {
    if (!session?.accessToken) {
      toast({ title: "Authentication Error", description: "Access token not available.", variant: "destructive" });
      throw new Error("Access token not available");
    }
    return session.accessToken;
  }, [session]);

  useEffect(() => {
    const orgIdFromQuery = searchParams.get("orgId");
    if (orgIdFromQuery) {
      setInitialOrgId(orgIdFromQuery);
      form.setValue("organizationId", orgIdFromQuery); // Pre-fill form
    }
  }, [searchParams, form]);

  useEffect(() => {
    async function fetchOrgs() {
      if (sessionStatus !== "authenticated") {
        if (sessionStatus === "loading") return;
        setIsLoadingOrganizations(false);
        return;
      }
      setIsLoadingOrganizations(true);
      try {
        const token = await getClientToken();
        const orgs = await getOrganizations(async () => token);
        setOrganizations(orgs);
      } catch (error: any) {
        console.error("Error fetching organizations:", error);
        toast({ title: "Error Fetching Organizations", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingOrganizations(false);
      }
    }
    if (sessionStatus === "unauthenticated") router.push("/login");
    else fetchOrgs();
  }, [sessionStatus, getClientToken, router]);

  const onSubmit = async (data: FormValues) => {
    if (sessionStatus !== "authenticated" || !session?.accessToken) {
      toast({ title: "Authentication Error", description: "You are not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const projectData: CreateProjectInput = {
        name: data.name,
        organization_id: Number.parseInt(data.organizationId),
      };
      const newProject = await createProject(projectData, getClientToken);
      toast({ title: "Project Created", description: `${newProject.name} has been successfully created.` });
      router.push(`/organizations/${data.organizationId}/projects`); // Navigate to the org-specific project list
      router.refresh(); 
    } catch (error) {
      console.error("Error creating project:", error);
      toast({ title: "Error Creating Project", description: error instanceof Error ? error.message : "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === "loading" || isLoadingOrganizations) {
    return (
      <div className="space-y-4 p-8 pt-6 text-center">
        <p>Loading organizations...</p>
      </div>
    );
  }
  
  const selectedOrgForTitle = organizations.find(org => org.id.toString() === form.watch("organizationId"));

  return (
    <div className="flex flex-col items-center w-full min-h-full pt-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-2 self-start">
          <Button variant="ghost" size="icon" asChild>
             {/* TODO: Make back button dynamic based on where user came from, or to /projects */}
            <Link href={initialOrgId ? `/organizations/${initialOrgId}/projects` : "/projects"}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">
            Create New Project {selectedOrgForTitle ? `in ${selectedOrgForTitle.name}` : ''}
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-6 w-6" />
              New Project Details
            </CardTitle>
            <CardDescription>
              Select an organization and provide a name for your new project.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="organizationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || !!initialOrgId}>
                        <FormControl>
                          <SelectTrigger className={!field.value ? "text-muted-foreground" : ""}>
                            <SelectValue placeholder="Select an organization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>The organization this project will belong to.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>This is the name of your project.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={initialOrgId ? `/organizations/${initialOrgId}/projects` : "/projects"}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting || sessionStatus !== 'authenticated'}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
} 