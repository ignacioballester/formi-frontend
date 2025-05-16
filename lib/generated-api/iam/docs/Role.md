# Role


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Unique role name | [default to undefined]
**resource_type** | **string** | Type of resource this role applies to | [default to undefined]
**display_name** | **string** | Human-readable role name | [default to undefined]
**permissions** | **Array&lt;string&gt;** | List of permissions granted by this role | [default to undefined]

## Example

```typescript
import { Role } from './api';

const instance: Role = {
    name,
    resource_type,
    display_name,
    permissions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
