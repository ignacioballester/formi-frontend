# ResourcesApi

All URIs are relative to *http://localhost:8081/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createResource**](#createresource) | **POST** /resources | Create a new resource|
|[**deleteResource**](#deleteresource) | **DELETE** /resources/{resource_name} | Delete a resource|
|[**getResource**](#getresource) | **GET** /resources/{resource_name} | Get resource details|
|[**updateResourceAttributes**](#updateresourceattributes) | **PUT** /resources/{resource_name} | Update resource attributes|

# **createResource**
> Resource createResource(createResourceInput)


### Example

```typescript
import {
    ResourcesApi,
    Configuration,
    CreateResourceInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ResourcesApi(configuration);

let createResourceInput: CreateResourceInput; //

const { status, data } = await apiInstance.createResource(
    createResourceInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createResourceInput** | **CreateResourceInput**|  | |


### Return type

**Resource**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Resource created successfully |  -  |
|**400** | Bad request |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteResource**
> deleteResource()


### Example

```typescript
import {
    ResourcesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ResourcesApi(configuration);

let resourceName: string; // (default to undefined)

const { status, data } = await apiInstance.deleteResource(
    resourceName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resourceName** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Resource deleted successfully |  -  |
|**404** | Resource not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getResource**
> Resource getResource()


### Example

```typescript
import {
    ResourcesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ResourcesApi(configuration);

let resourceName: string; // (default to undefined)

const { status, data } = await apiInstance.getResource(
    resourceName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resourceName** | [**string**] |  | defaults to undefined|


### Return type

**Resource**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Resource details |  -  |
|**404** | Resource not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateResourceAttributes**
> updateResourceAttributes(resourceAttributes)


### Example

```typescript
import {
    ResourcesApi,
    Configuration,
    ResourceAttributes
} from './api';

const configuration = new Configuration();
const apiInstance = new ResourcesApi(configuration);

let resourceName: string; // (default to undefined)
let resourceAttributes: ResourceAttributes; //

const { status, data } = await apiInstance.updateResourceAttributes(
    resourceName,
    resourceAttributes
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resourceAttributes** | **ResourceAttributes**|  | |
| **resourceName** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Resource attributes updated successfully |  -  |
|**400** | Bad request |  -  |
|**404** | Resource not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

