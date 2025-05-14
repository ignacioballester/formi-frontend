import React from 'react';
import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  Registry,
  TemplatesType,
  isObject,
} from '@rjsf/utils';
import CustomArrayFieldItemTemplate from './CustomArrayFieldItemTemplate';

// No top-level generics for CustomArrayFieldTemplate itself
const CustomArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const {
    schema,     // Default: RJSFSchema (schema for the array)
    registry,   // Default: Registry<any, RJSFSchema, any>
    uiSchema,   // Default: UiSchema<any, RJSFSchema, any>
    idSchema,
    items,      // Default: ArrayFieldTemplateItemType<any, RJSFSchema, any>[]
    canAdd,
    disabled,
    readonly,
    title,
    required,
    onAddClick,
    formData,   // Default: any; for an array field, this would be any[]
    // onDropIndexClick, onReorderClick should be on ArrayFieldTemplateProps by default
  } = props;

  // These will use the default generics from props, no need to pass <T,S,F> explicitly
  const uiOptions = getUiOptions(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate('ArrayFieldDescriptionTemplate', registry, uiOptions);
  const ArrayFieldTitleTemplate = getTemplate('ArrayFieldTitleTemplate', registry, uiOptions);
  // If ButtonTemplates is correctly typed in the default Registry, no complex cast is needed
  const { AddButton } = registry.templates.ButtonTemplates;

  const itemIsRemovable = (item: ArrayFieldTemplateItemType): boolean => { // item is default generic: ArrayFieldTemplateItemType<any,RJSFSchema,any>
    if (disabled || readonly) return false;
    const itemUiOptions = getUiOptions(item.uiSchema); // item.uiSchema is UiSchema<any,RJSFSchema,any>
    if (itemUiOptions.removable === false) return false;
    if (schema.minItems !== undefined && items.length <= schema.minItems) return false;
    return true;
  };

  const itemIsOrderable = (item: ArrayFieldTemplateItemType): boolean => { // item is default generic
    if (disabled || readonly) return false;
    const itemUiOptions = getUiOptions(item.uiSchema);
    return itemUiOptions.orderable !== false;
  };

  return (
    <div className={`rjsf-array-field ${props.className || ''}`}>
      <ArrayFieldTitleTemplate
        key={`array-field-title-${idSchema.$id}`}
        title={uiOptions.title || title}
        idSchema={idSchema}
        required={required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
      {(uiOptions.description || schema.description) && (
        <ArrayFieldDescriptionTemplate
          key={`array-field-description-${idSchema.$id}`}
          description={uiOptions.description || schema.description!}
          idSchema={idSchema}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div key={`array-item-list-${idSchema.$id}`} className="space-y-1 pt-2">
        {/* itemData will be ArrayFieldTemplateItemType<any, RJSFSchema, any> due to props.items typing */} 
        {items && items.map((itemData: ArrayFieldTemplateItemType) => {
            // itemData.schema is RJSFSchema (schema for the item)
            // itemData.uiSchema is UiSchema<any, RJSFSchema, any> (uiSchema for the item)
            const currentItemFormData = Array.isArray(formData) ? formData[itemData.index] : undefined; // formData is any[] or any

            const currentItemIsOrderable = itemIsOrderable(itemData);
            const currentItemIsRemovable = itemIsRemovable(itemData);
            
            // CustomArrayFieldItemTemplate will use its default generics <any, RJSFSchema, any>
            // if we don't provide explicit ones here.
            return (
              <CustomArrayFieldItemTemplate
                key={itemData.key}
                children={itemData.children}
                className={itemData.className}
                disabled={itemData.disabled ?? false}
                hasToolbar={itemData.hasToolbar ?? true}
                index={itemData.index}
                readonly={itemData.readonly ?? false}
                uiSchema={itemData.uiSchema as UiSchema<any, RJSFSchema, any>} // Align with itemData's uiSchema type       
                registry={registry as Registry<any, RJSFSchema, any>} // Align with props.registry type
                schema={itemData.schema as RJSFSchema} // Align with itemData's schema type             
                formData={currentItemFormData} // This is `any` and matches default T for CustomArrayFieldItemTemplate
                hasMoveUp={!!(currentItemIsOrderable && itemData.index > 0)}
                hasMoveDown={!!(currentItemIsOrderable && itemData.index < items.length - 1)}
                hasRemove={!!currentItemIsRemovable}
                onDropIndexClick={props.onDropIndexClick as any} 
                onReorderClick={props.onReorderClick as any}
              />
            );
          })}
      </div>
      {canAdd && AddButton && (
        <div className="mt-4 flex justify-end">
          <AddButton
            className="rjsf-add-button"
            onClick={onAddClick}
            disabled={disabled || readonly}
            uiSchema={uiSchema} 
            registry={registry}
          />
        </div>
      )}
    </div>
  );
};

export default CustomArrayFieldTemplate; 