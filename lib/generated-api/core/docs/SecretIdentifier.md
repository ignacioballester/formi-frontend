# SecretIdentifier


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the secret | [default to undefined]
**organization_id** | **number** | ID of the organization that owns the secret | [default to undefined]
**project_id** | **number** | ID of the project that owns the secret (optional) | [optional] [default to undefined]
**type** | **string** | Type of the secret | [default to undefined]

## Example

```typescript
import { SecretIdentifier } from './api';

const instance: SecretIdentifier = {
    name,
    organization_id,
    project_id,
    type,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
