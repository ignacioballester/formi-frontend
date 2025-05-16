# ModuleConfig


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**config_file_path** | **string** | Path to the module configuration file | [optional] [default to undefined]
**variables** | [**{ [key: string]: VariableConfiguration; }**](VariableConfiguration.md) | Variable configurations | [optional] [default to undefined]
**review_required** | [**Array&lt;ReviewRequirement&gt;**](ReviewRequirement.md) | Review requirements | [optional] [default to undefined]
**credentials** | [**Array&lt;ModuleCredentialConfiguration&gt;**](ModuleCredentialConfiguration.md) | Credential configurations | [optional] [default to undefined]
**environment_variables** | [**Array&lt;EnvironmentVariable&gt;**](EnvironmentVariable.md) | Environment variable configurations | [optional] [default to undefined]
**deployment_variables** | [**Array&lt;DeploymentVariable&gt;**](DeploymentVariable.md) | Deployment variable configurations | [optional] [default to undefined]
**external_modules** | [**Array&lt;ExternalModule&gt;**](ExternalModule.md) | External module configurations | [optional] [default to undefined]

## Example

```typescript
import { ModuleConfig } from './api';

const instance: ModuleConfig = {
    config_file_path,
    variables,
    review_required,
    credentials,
    environment_variables,
    deployment_variables,
    external_modules,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
