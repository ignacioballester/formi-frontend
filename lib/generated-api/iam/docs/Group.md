# Group


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Group name | [default to undefined]
**id** | **string** | Group ID | [optional] [default to undefined]
**sub_groups** | [**Array&lt;Group&gt;**](Group.md) |  | [optional] [default to undefined]
**members** | [**Array&lt;User&gt;**](User.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Group } from './api';

const instance: Group = {
    name,
    id,
    sub_groups,
    members,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
