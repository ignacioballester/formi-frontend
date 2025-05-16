# AuthorizationApi

All URIs are relative to *http://localhost:8081/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**isUserAuthorized**](#isuserauthorized) | **POST** /authorization/check | Check if a user is authorized to access a resource|

# **isUserAuthorized**
> AuthorizationCheckResult isUserAuthorized(authorizationCheckInput)


### Example

```typescript
import {
    AuthorizationApi,
    Configuration,
    AuthorizationCheckInput
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthorizationApi(configuration);

let authorizationCheckInput: AuthorizationCheckInput; //

const { status, data } = await apiInstance.isUserAuthorized(
    authorizationCheckInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorizationCheckInput** | **AuthorizationCheckInput**|  | |


### Return type

**AuthorizationCheckResult**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Authorization check result |  -  |
|**400** | Bad request |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

