# Repository


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | Unique identifier for the repository | [default to undefined]
**name** | **string** | Name of the repository | [default to undefined]
**url** | **string** | URL of the repository | [default to undefined]
**project_id** | **number** | ID of the project this repository belongs to | [optional] [default to undefined]
**organization_id** | **number** | ID of the organization this repository belongs to | [default to undefined]
**secret** | [**SecretIdentifier**](SecretIdentifier.md) |  | [default to undefined]
**status** | [**RepositoryStatus**](RepositoryStatus.md) |  | [default to undefined]

## Example

```typescript
import { Repository } from './api';

const instance: Repository = {
    id,
    name,
    url,
    project_id,
    organization_id,
    secret,
    status,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
