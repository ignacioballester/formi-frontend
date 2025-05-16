# SecretCreate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** |  | [default to undefined]
**display_name** | **string** |  | [optional] [default to undefined]
**type** | **string** |  | [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**organization_id** | **number** |  | [optional] [default to undefined]
**project_id** | **number** |  | [optional] [default to undefined]
**data** | **{ [key: string]: any; }** |  | [default to undefined]

## Example

```typescript
import { SecretCreate } from './api';

const instance: SecretCreate = {
    name,
    display_name,
    type,
    description,
    organization_id,
    project_id,
    data,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
