# CreateModuleInput


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the module | [default to undefined]
**repository_id** | **number** | ID of the repository containing the module | [default to undefined]
**working_directory** | **string** | Working directory for the module | [default to undefined]
**project_id** | **number** | ID of the project this module belongs to | [optional] [default to undefined]
**organization_id** | **number** | ID of the organization this module belongs to | [default to undefined]
**git_reference** | [**GitReference**](GitReference.md) |  | [default to undefined]

## Example

```typescript
import { CreateModuleInput } from './api';

const instance: CreateModuleInput = {
    name,
    repository_id,
    working_directory,
    project_id,
    organization_id,
    git_reference,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
