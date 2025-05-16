# Run


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [optional] [readonly] [default to undefined]
**deployment_id** | **number** |  | [optional] [default to undefined]
**status** | [**RunStatus**](RunStatus.md) |  | [optional] [default to undefined]
**status_details** | [**StatusDetails**](StatusDetails.md) |  | [optional] [default to undefined]
**properties** | [**RunProperties**](RunProperties.md) |  | [optional] [default to undefined]
**timestamp** | **string** |  | [optional] [readonly] [default to undefined]

## Example

```typescript
import { Run } from './api';

const instance: Run = {
    id,
    deployment_id,
    status,
    status_details,
    properties,
    timestamp,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
