# VariableConfiguration


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**_options** | **Array&lt;any&gt;** | Available options for the variable (list of any type - string, number, boolean, object, etc.) | [optional] [default to undefined]
**addable** | **boolean** | Whether new options can be added beyond the predefined list. If true, users can add values not in the \&#39;options\&#39; list. If false or omitted, only values from the \&#39;options\&#39; list are allowed. | [optional] [default to undefined]

## Example

```typescript
import { VariableConfiguration } from './api';

const instance: VariableConfiguration = {
    _options,
    addable,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
