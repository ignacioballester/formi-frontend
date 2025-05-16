# RolesApi

All URIs are relative to *http://localhost:8081/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getRoleByName**](#getrolebyname) | **GET** /roles/{name} | Get a role by name|
|[**getRolesByResourceType**](#getrolesbyresourcetype) | **GET** /roles | List all roles for a resource type|

# **getRoleByName**
> Role getRoleByName()


### Example

```typescript
import {
    RolesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RolesApi(configuration);

let name: string; // (default to undefined)

const { status, data } = await apiInstance.getRoleByName(
    name
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **name** | [**string**] |  | defaults to undefined|


### Return type

**Role**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Role details |  -  |
|**404** | Resource not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRolesByResourceType**
> Array<Role> getRolesByResourceType()


### Example

```typescript
import {
    RolesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RolesApi(configuration);

let resourceType: 'enterprise' | 'organization' | 'project'; // (default to undefined)

const { status, data } = await apiInstance.getRolesByResourceType(
    resourceType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resourceType** | [**&#39;enterprise&#39; | &#39;organization&#39; | &#39;project&#39;**]**Array<&#39;enterprise&#39; &#124; &#39;organization&#39; &#124; &#39;project&#39;>** |  | defaults to undefined|


### Return type

**Array<Role>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of roles |  -  |
|**400** | Bad request |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

