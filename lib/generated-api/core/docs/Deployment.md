# Deployment


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | Unique identifier for the deployment | [default to undefined]
**version** | **number** | Version number of the deployment | [default to undefined]
**project_id** | **number** | ID of the project this deployment belongs to | [default to undefined]
**module_id** | **number** | ID of the module being deployed | [default to undefined]
**inputs** | [**DeploymentInputs**](DeploymentInputs.md) |  | [default to undefined]
**status** | [**DeploymentStatus**](DeploymentStatus.md) |  | [default to undefined]
**status_details** | [**DeploymentStatusDetails**](DeploymentStatusDetails.md) |  | [default to undefined]

## Example

```typescript
import { Deployment } from './api';

const instance: Deployment = {
    id,
    version,
    project_id,
    module_id,
    inputs,
    status,
    status_details,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
