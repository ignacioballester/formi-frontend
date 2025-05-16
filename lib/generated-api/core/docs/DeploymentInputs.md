# DeploymentInputs


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tf_vars** | **object** | Terraform variables | [default to undefined]
**secrets** | **Array&lt;object&gt;** |  | [optional] [default to undefined]
**deployment_variable_inputs** | [**Array&lt;DeploymentVariableInput&gt;**](DeploymentVariableInput.md) |  | [optional] [default to undefined]

## Example

```typescript
import { DeploymentInputs } from './api';

const instance: DeploymentInputs = {
    tf_vars,
    secrets,
    deployment_variable_inputs,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
