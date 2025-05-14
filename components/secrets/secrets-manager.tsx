"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { PlusCircle, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SecretResponse,
  SecretCreate,
  SecretTypeDefinition,
  DataAttribute,
  SecretUpdate,
  listSecrets,
  createSecret,
  getSecret,
  updateSecret,
  deleteSecret,
} from "@/lib/api"
import { 
    listSecretsAction, 
    createSecretAction, 
    deleteSecretAction, 
    getSecretTypesAction,
    getSecretAction,
    updateSecretAction
} from "@/app/actions/secrets/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const secretFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  display_name: z.string().max(100).optional(),
  type: z.string().min(1, "Type is required").max(50),
  description: z.string().max(255).optional(),
}).passthrough();

type SecretFormValues = z.infer<typeof secretFormSchema> & {
  [key: string]: any
};

interface SecretsManagerProps {
  organizationId: number
  projectId?: number
  getClientToken: () => Promise<string>
  defaultSecretType?: string 
}

export function SecretsManager({
  organizationId,
  projectId,
  getClientToken,
  defaultSecretType,
}: SecretsManagerProps) {
  const [secrets, setSecrets] = useState<SecretResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<SecretResponse | null>(null)

  const [secretTypes, setSecretTypes] = useState<SecretTypeDefinition[]>([])
  const [selectedSecretTypeDefinition, setSelectedSecretTypeDefinition] = useState<SecretTypeDefinition | null>(null)
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SecretFormValues>({
    resolver: zodResolver(secretFormSchema),
    defaultValues: {
      name: "",
      display_name: "",
      type: "",
      description: "",
    },
  })

  const prevSelectedSecretTypeDefinitionRef = useRef<SecretTypeDefinition | null>(null);

  useEffect(() => {
    prevSelectedSecretTypeDefinitionRef.current = selectedSecretTypeDefinition;
  });

  const fetchAndSetSecretTypes = useCallback(async () => {
    if (secretTypes.length === 0) {
      setIsLoadingTypes(true);
      try {
        const token = await getClientToken();
        const result = await getSecretTypesAction(token);
        if (result.success && result.data) {
          setSecretTypes(result.data);
          return result.data;
        } else {
          toast({ title: "Error fetching secret types", description: result.error || "Could not load secret types.", variant: "destructive" })
        }
      } catch (err) {
        toast({ title: "Error fetching secret types", description: err instanceof Error ? err.message : "An unknown error occurred.", variant: "destructive" })
      } finally {
        setIsLoadingTypes(false);
      }
    }
    return secretTypes;
  }, [getClientToken, secretTypes]);
  
  useEffect(() => {
    if (isCreateDialogOpen || isEditDialogOpen) {
        fetchAndSetSecretTypes();
    }
  }, [isCreateDialogOpen, isEditDialogOpen, fetchAndSetSecretTypes]);
  
  const getDefaultValueForType = useCallback((type: DataAttribute["Type"]) => {
    switch (type) {
      case "string": return "";
      case "text": return "";
      case "number": return 0;
      case "boolean": return false;
      default: return "";
    }
  }, []);
  
  useEffect(() => {
    const previousDef = prevSelectedSecretTypeDefinitionRef.current;
    const currentDef = selectedSecretTypeDefinition;

    if (previousDef) {
      previousDef.DataAttributes.forEach(attr => {
        const fieldName = `data_${attr.Name}`;
        if (!currentDef || !currentDef.DataAttributes.some(currentAttr => currentAttr.Name === attr.Name)) {
          // console.log(`useEffect: Unregistering ${fieldName} as it's no longer in current definition`);
          form.unregister(fieldName as any, { keepValue: false }); 
        }
      });
    }
    prevSelectedSecretTypeDefinitionRef.current = selectedSecretTypeDefinition; 
  }, [selectedSecretTypeDefinition, form]);

  const handleTypeChange = (typeName: string) => {
    const definition = secretTypes.find(st => st.Name === typeName);
    setSelectedSecretTypeDefinition(definition || null); 

    const currentStaticValues = form.getValues(); 
    
    const newFormValues: SecretFormValues = {
        name: currentStaticValues.name,
        display_name: currentStaticValues.display_name,
        type: typeName, 
        description: currentStaticValues.description,
    };

    if (definition) {
        definition.DataAttributes.forEach(attr => {
            newFormValues[`data_${attr.Name}`] = getDefaultValueForType(attr.Type);
        });
    }
    
    form.reset(newFormValues, {
        keepDefaultValues: false, 
        keepDirty: false, 
        keepErrors: false, 
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false, 
    });
    // It's important to explicitly set and validate the type after reset if it's a key trigger
    form.setValue("type", typeName, {shouldValidate: true, shouldDirty: true}); 
  };
  
  const prepareAndResetForm = useCallback((secretContext?: SecretResponse | null) => {
    const typeToSet = secretContext?.type || defaultSecretType || "";
    const typeDef = typeToSet ? secretTypes.find(st => st.Name === typeToSet) : null;

    const baseValues: SecretFormValues = {
        name: secretContext?.name || "",
        display_name: secretContext?.display_name || "",
        type: typeToSet,
        description: secretContext?.description || "",
    };

    // Set definition first to allow useEffect for unregistration to run if needed
    setSelectedSecretTypeDefinition(typeDef || null); 

    if (typeDef) {
        typeDef.DataAttributes.forEach(attr => {
            let value;
            if (secretContext && secretContext.data && secretContext.data.hasOwnProperty(attr.Name)) {
                value = secretContext.data[attr.Name];
            } else {
                value = getDefaultValueForType(attr.Type);
            }
            baseValues[`data_${attr.Name}`] = value;
        });
    }

    form.reset(baseValues, {
        keepDefaultValues: false,
        keepDirty: !!secretContext, 
        keepErrors: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false, 
    });
    // Ensure type is validated if set, especially after reset
    if (typeToSet) { 
        form.setValue("type", typeToSet, {shouldValidate: true, shouldDirty: !!secretContext});
    }

  }, [form, secretTypes, defaultSecretType, getDefaultValueForType]);
  
  const fetchSecrets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = await getClientToken();
      const result = await listSecretsAction(
        token,
        organizationId,
        projectId,
        defaultSecretType
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to list secrets");
      }
      console.log("Fetched secrets:", result.data);
      setSecrets(result.data || []);
    } catch (err) {
      console.error("Failed to fetch secrets:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
      toast({ title: "Error fetching secrets", description: err instanceof Error ? err.message : "Could not load secrets.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, projectId, defaultSecretType, getClientToken])

  useEffect(() => {
    fetchSecrets()
  }, [fetchSecrets])

  const openCreateDialog = async () => {
    await fetchAndSetSecretTypes();
    prepareAndResetForm(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = async (secretToEdit: SecretResponse) => {
    setIsSubmitting(true);
    await fetchAndSetSecretTypes();
    setSelectedSecret(secretToEdit);

    try {
      const token = await getClientToken();
      const result = await getSecretAction(token, secretToEdit.name, secretToEdit.type, secretToEdit.organization_id, secretToEdit.project_id, true);
      if (result.success && result.data) {
        const fullSecret = result.data;
        setSelectedSecret(fullSecret);
        prepareAndResetForm(fullSecret);
        setIsEditDialogOpen(true);
      } else {
        toast({ title: "Error fetching secret details", description: result.error || "Could not load secret for editing.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error preparing edit dialog", description: err instanceof Error ? err.message : "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSecret = async (values: SecretFormValues) => {
    console.log("DEBUG: handleCreateSecret called. Form values received:", JSON.stringify(values, null, 2));
    
    setIsSubmitting(true);
    try {
      const token = await getClientToken();
      const dataObject: { [key: string]: any } = {};

      const currentTypeDefinition = secretTypes.find(st => st.Name === values.type);
      
      console.log("DEBUG: Matched Secret Type Definition for form type '" + values.type + "':", currentTypeDefinition);

      if (currentTypeDefinition) { 
        currentTypeDefinition.DataAttributes.forEach(attr => {
          const formFieldName = `data_${attr.Name}`;
          if (values.hasOwnProperty(formFieldName)) { 
            const formValue = values[formFieldName];
            if (attr.Type === "number") {
                if (typeof formValue === 'string') {
                    dataObject[attr.Name] = parseFloat(formValue);
                    if (isNaN(dataObject[attr.Name])) {
                        dataObject[attr.Name] = 0; 
                    }
                } else if (typeof formValue === 'number'){
                    dataObject[attr.Name] = formValue;
                } else {
                    dataObject[attr.Name] = 0;
                }
            } else if (attr.Type === "boolean") {
                dataObject[attr.Name] = Boolean(formValue);
            } else {
                dataObject[attr.Name] = formValue;
            }
          } else {
            if (attr.Required) {
                console.warn(`DEBUG: Required attribute ${attr.Name} (form field ${formFieldName}) was missing from submitted form values.`);
            }
          }
        });
      } else {
        console.error(`DEBUG: No secret type definition found for type: ${values.type}. Data object will remain empty.`);
      }
      
      console.log("Final constructed dataObject before API call:", JSON.stringify(dataObject, null, 2));

      const secretDataToCreate: SecretCreate = {
        name: values.name,
        display_name: values.display_name,
        type: values.type,
        description: values.description,
        organization_id: organizationId,
        project_id: projectId, 
        data: dataObject,
      };
      
      const result = await createSecretAction(secretDataToCreate, token);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create secret");
      }
      
      setSecrets((prev) => [...prev, result.data!]);
      toast({ title: "Secret created", description: `Secret '${result.data.name}' created successfully.` })
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Failed to create secret:", err);
      toast({ title: "Error creating secret", description: err instanceof Error ? err.message : "Could not create secret.", variant: "destructive" })
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSecret = async (values: SecretFormValues) => {
    if (!selectedSecret) return;
    console.log("DEBUG: handleUpdateSecret called. Form values received:", JSON.stringify(values, null, 2));
    setIsSubmitting(true);
    try {
      const token = await getClientToken();
      const dataObject: { [key: string]: any } = {};
      const typeDefForUpdate = secretTypes.find(st => st.Name === selectedSecret.type);

      if (typeDefForUpdate) {
        typeDefForUpdate.DataAttributes.forEach(attr => {
          const formFieldName = `data_${attr.Name}`;
          if (values.hasOwnProperty(formFieldName)) {
            const formValue = values[formFieldName];
             if (attr.Type === "number") {
                if (typeof formValue === 'string') {
                    dataObject[attr.Name] = parseFloat(formValue);
                    if (isNaN(dataObject[attr.Name])) { dataObject[attr.Name] = 0; }
                } else if (typeof formValue === 'number'){
                    dataObject[attr.Name] = formValue;
                } else { dataObject[attr.Name] = 0; }
            } else if (attr.Type === "boolean") {
                dataObject[attr.Name] = Boolean(formValue);
            } else {
                dataObject[attr.Name] = formValue;
            }
          } else {
             if (attr.Required && !(attr.Private && selectedSecret.data && selectedSecret.data[attr.Name] !== undefined) ) { 
                console.warn(`DEBUG: Required attribute ${attr.Name} (form field ${formFieldName}) was missing during update.`);
             }
          }
        });
      }

      const secretDataToUpdate: SecretUpdate = {
        display_name: values.display_name,
        description: values.description,
        type: selectedSecret.type,
        organization_id: selectedSecret.organization_id,
        project_id: selectedSecret.project_id,
        data: dataObject,
      };

      const result = await updateSecretAction(token, selectedSecret.name, secretDataToUpdate);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to update secret");
      }

      setSecrets((prev) => prev.map(s => s.name === result.data!.name && s.type === result.data!.type ? result.data! : s));
      toast({ title: "Secret updated", description: `Secret '${result.data.name}' updated successfully.` });
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Failed to update secret:", err);
      toast({ title: "Error updating secret", description: err instanceof Error ? err.message : "Could not update secret.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSecret = async (secret: SecretResponse) => {
    if (!secret) return;
    setIsSubmitting(true);
    try {
      const token = await getClientToken();
      const targetType = secret.type;

      const result = await deleteSecretAction(
        secret.name,
        targetType,
        token,
        organizationId,
        secret.project_id
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete secret");
      }
      
      setSecrets((prev) => prev.filter(s => !(s.name === secret.name && s.type === secret.type && s.project_id === secret.project_id)));
      toast({ title: "Secret deleted", description: `Secret '${secret.name}' deleted successfully.` });
      setIsDeleteDialogOpen(false);
      setSelectedSecret(null);
    } catch (err) {
      console.error("Failed to delete secret:", err);
      toast({ title: "Error deleting secret", description: err instanceof Error ? err.message : "Could not delete secret.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading && secrets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-10 w-full" />
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 p-4 border border-red-200 dark:border-red-700 rounded-md bg-red-50 dark:bg-red-900/30">
        <p><strong>Error:</strong> {error}</p>
        <Button onClick={fetchSecrets} variant="outline" className="mt-2">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Manage Secrets {projectId ? `for Project ID: ${projectId}` : `for Organization ID: ${organizationId}`}
        </h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) form.reset(); setIsCreateDialogOpen(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Secret
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Secret</DialogTitle>
              <DialogDescription>
                Select the type of secret and fill in its details.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateSecret)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Name (Identifier)</FormLabel>
                      <FormControl><Input placeholder="e.g., my-service-api-key-prod" {...field} /></FormControl>
                      <FormDescription>Unique identifier for this secret.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., Production API Key for My Service" {...field} /></FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={handleTypeChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger disabled={isLoadingTypes || secretTypes.length === 0}>
                            <SelectValue placeholder={isLoadingTypes ? "Loading types..." : (secretTypes.length === 0 ? "No types available" : "Select a secret type")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {secretTypes.map(st => (
                            <SelectItem key={st.Name} value={st.Name}>
                              {st.DisplayName} ({st.Name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>{selectedSecretTypeDefinition?.Description || "Category or type of the secret."}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="A brief description of what this secret is for." {...field} rows={2} /></FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedSecretTypeDefinition && selectedSecretTypeDefinition.DataAttributes.map(attr => (
                  <FormField
                    key={`create-${attr.Name}`}
                    control={form.control}
                    name={`data_${attr.Name}` as any}
                    defaultValue={getDefaultValueForType(attr.Type)}
                    rules={{ required: attr.Required }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{attr.DisplayName || attr.Name}{attr.Required ? "*" : ""}</FormLabel>
                        <FormControl>
                          {attr.Type === "string" && attr.Private ? (
                            <Input type="password" placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} />
                          ) : attr.Type === "string" ? (
                            <Input placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} />
                          ) : attr.Type === "text" ? (
                            <Textarea placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} rows={3} />
                          ) : attr.Type === "number" ? (
                            <Input type="number" placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} onChange={e => field.onChange(Number(e.target.value))} value={field.value === undefined ? '' : field.value} />
                          ) : attr.Type === "boolean" ? (
                            <input type="checkbox" {...field} checked={!!field.value} onChange={e => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                          ) : (
                            <Input placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} />
                          )}
                        </FormControl>
                        {attr.Description && <FormDescription>{attr.Description}</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <DialogFooter>
                  <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting || !form.formState.isValid || !selectedSecretTypeDefinition}>
                    {isSubmitting ? "Creating..." : "Create Secret"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && secrets.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
              <Skeleton className="h-6 w-1/4" /> <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/2" /> <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 p-4 border border-red-200 dark:border-red-700 rounded-md bg-red-50 dark:bg-red-900/30">
          <p><strong>Error:</strong> {error}</p>
          <Button onClick={fetchSecrets} variant="outline" className="mt-2">Try Again</Button>
        </div>
      ) : secrets.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center">No secrets found for the current scope.</p>
      ) : (
        <div className="rounded-md border mt-4">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name / Display Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {secrets.map((secret) => (
                <TableRow key={`${secret.name}-${secret.type}-${secret.project_id || 'org'}`}>
                    <TableCell>
                    <span className="font-medium">{secret.name}</span>
                    {secret.display_name && <p className="text-xs text-muted-foreground">{secret.display_name}</p>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{secret.type}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {secret.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(secret)} className="mr-2">
                        <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Dialog open={isDeleteDialogOpen && selectedSecret?.name === secret.name && selectedSecret?.type === secret.type} 
                            onOpenChange={(isOpen) => { if(!isOpen) setSelectedSecret(null); setIsDeleteDialogOpen(isOpen); }}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                setSelectedSecret(secret)
                                setIsDeleteDialogOpen(true)
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                            >
                                <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Secret: {selectedSecret?.name}</DialogTitle>
                                <DialogDescription>
                                Are you sure you want to delete the secret named "{selectedSecret?.name}" of type "{selectedSecret?.type}"?
                                This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                                <Button variant="destructive" onClick={() => selectedSecret && handleDeleteSecret(selectedSecret)} disabled={isSubmitting}>
                                {isSubmitting ? "Deleting..." : "Delete Secret"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) form.reset(); setIsEditDialogOpen(isOpen); }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Secret: {selectedSecret?.name}</DialogTitle>
              <DialogDescription>
                Update the details for your secret.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateSecret)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Name (Identifier)</FormLabel>
                      <FormControl><Input placeholder="e.g., my-service-api-key-prod" {...field} readOnly disabled className="cursor-not-allowed bg-muted/50"/></FormControl>
                      <FormDescription>Unique identifier for this secret (cannot be changed).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., Production API Key for My Service" {...field} /></FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} disabled >
                        <FormControl>
                          <SelectTrigger className="cursor-not-allowed bg-muted/50">
                            <SelectValue placeholder="Select a secret type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {secretTypes.map(st => (
                            <SelectItem key={st.Name} value={st.Name}>
                              {st.DisplayName} ({st.Name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>{selectedSecretTypeDefinition?.Description || "Category or type of the secret."}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="A brief description of what this secret is for." {...field} rows={2} /></FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedSecretTypeDefinition && selectedSecretTypeDefinition.DataAttributes.map(attr => (
                  <FormField
                    key={`edit-${attr.Name}`}
                    control={form.control}
                    name={`data_${attr.Name}` as any}
                    defaultValue={getDefaultValueForType(attr.Type)}
                    rules={{ required: attr.Required && !(selectedSecret?.data && selectedSecret.data[attr.Name] !== undefined && attr.Private) }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{attr.DisplayName || attr.Name}{attr.Required && !(selectedSecret?.data && selectedSecret.data[attr.Name] !== undefined && attr.Private) ? "*" : ""}</FormLabel>
                        <FormControl>
                          {attr.Type === "string" && attr.Private ? (
                            <Input type="password" placeholder={selectedSecret?.data && selectedSecret.data[attr.Name] !== undefined ? "Stored, enter to change" : `Enter ${attr.DisplayName || attr.Name}`} {...field} />
                          ) : attr.Type === "string" ? (
                            <Input placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} />
                          ) : attr.Type === "text" ? (
                            <Textarea placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} rows={3} />
                          ) : attr.Type === "number" ? (
                            <Input type="number" placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} onChange={e => field.onChange(Number(e.target.value))} value={field.value === undefined ? '' : field.value}/>
                          ) : attr.Type === "boolean" ? (
                            <input type="checkbox" {...field} checked={!!field.value} onChange={e => field.onChange(e.target.checked)}  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                          ) : (
                            <Input placeholder={`Enter ${attr.DisplayName || attr.Name}`} {...field} />
                          )}
                        </FormControl>
                        {attr.Description && <FormDescription>{attr.Description}</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <DialogFooter>
                  <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                    {isSubmitting ? "Updating..." : "Update Secret"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
    </div>
  )
} 