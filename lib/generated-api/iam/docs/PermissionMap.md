# PermissionMap


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**users** | **{ [key: string]: Array&lt;string&gt;; }** | Map of user IDs to permissions | [optional] [default to undefined]
**groups** | **{ [key: string]: Array&lt;string&gt;; }** | Map of group IDs to permissions | [optional] [default to undefined]

## Example

```typescript
import { PermissionMap } from './api';

const instance: PermissionMap = {
    users,
    groups,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
