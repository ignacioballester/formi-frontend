# Module


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | Unique identifier for the module | [default to undefined]
**name** | **string** | Name of the module | [default to undefined]
**repository_id** | **number** | ID of the repository containing the module | [default to undefined]
**project_id** | **number** | ID of the project this module belongs to | [optional] [default to undefined]
**organization_id** | **number** | ID of the organization this module belongs to | [default to undefined]
**working_directory** | **string** | Working directory for the module | [default to undefined]
**git_reference** | [**GitReference**](GitReference.md) |  | [default to undefined]
**terraform_properties** | [**TerraformProperties**](TerraformProperties.md) |  | [default to undefined]
**module_config** | [**ModuleConfig**](ModuleConfig.md) |  | [default to undefined]
**status** | [**ModuleStatus**](ModuleStatus.md) |  | [default to undefined]

## Example

```typescript
import { Module } from './api';

const instance: Module = {
    id,
    name,
    repository_id,
    project_id,
    organization_id,
    working_directory,
    git_reference,
    terraform_properties,
    module_config,
    status,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
