# ModuleCredentialConfiguration


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** | Type of credential | [default to undefined]
**_options** | [**Array&lt;SecretIdentifier&gt;**](SecretIdentifier.md) | Available credential options | [optional] [default to undefined]
**project_credentials_allowed** | **boolean** | Whether project credentials are allowed | [optional] [default to undefined]

## Example

```typescript
import { ModuleCredentialConfiguration } from './api';

const instance: ModuleCredentialConfiguration = {
    type,
    _options,
    project_credentials_allowed,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
