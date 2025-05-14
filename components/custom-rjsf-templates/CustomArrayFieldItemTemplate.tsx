import React, { useState } from 'react';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  Registry,
  TemplatesType,
  getUiOptions,
} from '@rjsf/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit3Icon } from 'lucide-react';

export interface CustomArrayFieldItemProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  children: React.ReactNode;
  className?: string;
  disabled: boolean;
  hasToolbar: boolean;
  hasMoveUp: boolean;
  hasMoveDown: boolean;
  hasRemove: boolean;
  index: number;
  onDropIndexClick: (index: number) => (event?: any) => void;
  onReorderClick: (index: number, newIndex: number) => (event?: any) => void;
  readonly: boolean;
  uiSchema?: UiSchema<T, S, F>;
  registry: Registry<T, S, F>;
  schema: S;
  formData?: T;
}

const CustomArrayFieldItemTemplate = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: CustomArrayFieldItemProps<T, S, F>
) => {
  const { 
    children, 
    disabled, 
    hasMoveDown, 
    hasMoveUp, 
    hasRemove, 
    hasToolbar,
    index, 
    onDropIndexClick, 
    onReorderClick, 
    readonly, 
    registry,
    schema,
    uiSchema,
    formData,
  } = props;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { MoveUpButton, MoveDownButton, RemoveButton } = registry.templates.ButtonTemplates as TemplatesType<T,S,F>['ButtonTemplates'];

  const displayItemData = () => {
    if (typeof formData === 'object' && formData !== null) {
      const item = formData as Record<string, any>; // Cast to make it indexable
      const uiOptions = getUiOptions<T, S, F>(uiSchema);
      const titleKey = uiOptions.titleKey as string || 'title';
      const nameKey = uiOptions.nameKey as string || 'name';
      
      let displayValue = item[titleKey] || item[nameKey];
      if (displayValue !== undefined && displayValue !== null) {
        return String(displayValue);
      }
      // Fallback to stringifying the object if no title/name key found or value is null/undefined
      return JSON.stringify(item, null, 2);
    } else if (formData !== undefined && formData !== null) {
      return String(formData);
    }
    return "Item " + (index + 1); // Default if formData is undefined/null
  };

  return (
    <div className="flex items-center space-x-2 py-2 group">
      {hasToolbar && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {hasMoveUp && MoveUpButton && (
            <MoveUpButton
              disabled={disabled || readonly || !hasMoveUp}
              onClick={onReorderClick(index, index - 1)}
              registry={registry}
              uiSchema={uiSchema}
            />
          )}
          {hasMoveDown && MoveDownButton && (
            <MoveDownButton
              disabled={disabled || readonly || !hasMoveDown}
              onClick={onReorderClick(index, index + 1)}
              registry={registry}
              uiSchema={uiSchema}
            />
          )}
        </div>
      )}
      <div className="flex-grow p-2 border rounded-md min-h-[40px] flex items-center bg-background hover:border-primary/50 transition-colors">
        <span className="text-sm truncate">{displayItemData()}</span>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" disabled={disabled || readonly}>
            <Edit3Icon className="h-4 w-4" />
            <span className="sr-only">Edit Item</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Item {index + 1}</DialogTitle>
            {schema.description && <DialogDescription>{schema.description}</DialogDescription>}
          </DialogHeader>
          
          <div className="py-4 max-h-[70vh] overflow-y-auto rjsf-dialog-item-edit-form">
            {children}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hasRemove && RemoveButton && !readonly && !disabled && (
        <RemoveButton 
            disabled={disabled || readonly} 
            onClick={onDropIndexClick(index)} 
            registry={registry} 
            uiSchema={uiSchema} 
        />
      )}
    </div>
  );
};

export default CustomArrayFieldItemTemplate; 