# CreateRepositoryInput


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the repository | [default to undefined]
**url** | **string** | URL of the repository | [default to undefined]
**project_id** | **number** | ID of the project this repository belongs to | [optional] [default to undefined]
**organization_id** | **number** | ID of the organization this repository belongs to | [default to undefined]
**secret** | [**SecretIdentifier**](SecretIdentifier.md) |  | [default to undefined]

## Example

```typescript
import { CreateRepositoryInput } from './api';

const instance: CreateRepositoryInput = {
    name,
    url,
    project_id,
    organization_id,
    secret,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
