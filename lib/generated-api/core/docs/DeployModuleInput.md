# DeployModuleInput


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**module_id** | **number** | ID of the module to deploy | [default to undefined]
**project_id** | **number** | ID of the project to deploy to | [default to undefined]
**inputs** | [**DeploymentInputs**](DeploymentInputs.md) |  | [default to undefined]

## Example

```typescript
import { DeployModuleInput } from './api';

const instance: DeployModuleInput = {
    module_id,
    project_id,
    inputs,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
