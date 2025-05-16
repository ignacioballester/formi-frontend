# ModuleStatus


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**configuration_valid** | **boolean** | Whether the module configuration is valid | [optional] [default to undefined]
**configuration_error** | **string** | Error message if configuration is invalid | [optional] [default to undefined]
**terraform_valid** | **boolean** | Whether the Terraform configuration is valid | [optional] [default to undefined]

## Example

```typescript
import { ModuleStatus } from './api';

const instance: ModuleStatus = {
    configuration_valid,
    configuration_error,
    terraform_valid,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
