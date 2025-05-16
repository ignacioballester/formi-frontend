# ModulesApi

All URIs are relative to *http://localhost:8083/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**modulesGet**](#modulesget) | **GET** /modules | Get all modules|
|[**modulesIdDelete**](#modulesiddelete) | **DELETE** /modules/{id} | Delete a module|
|[**modulesIdGet**](#modulesidget) | **GET** /modules/{id} | Get module by ID|
|[**modulesIdPut**](#modulesidput) | **PUT** /modules/{id} | Update a module|
|[**modulesPost**](#modulespost) | **POST** /modules | Create a new module|

# **modulesGet**
> Array<Module> modulesGet()

Retrieve a list of all modules, optionally filtered by project_id and organization_id

### Example

```typescript
import {
    ModulesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ModulesApi(configuration);

let projectId: number; //Project ID (optional) (default to undefined)
let organizationId: number; //Organization ID (optional) (default to undefined)

const { status, data } = await apiInstance.modulesGet(
    projectId,
    organizationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**number**] | Project ID | (optional) defaults to undefined|
| **organizationId** | [**number**] | Organization ID | (optional) defaults to undefined|


### Return type

**Array<Module>**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of modules |  -  |
|**400** | Invalid project ID or organization ID |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **modulesIdDelete**
> modulesIdDelete()

Delete a module by its ID

### Example

```typescript
import {
    ModulesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ModulesApi(configuration);

let id: number; //Module ID (default to undefined)

const { status, data } = await apiInstance.modulesIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Module ID | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Module deleted successfully |  -  |
|**400** | Invalid module ID |  -  |
|**404** | Module not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **modulesIdGet**
> Module modulesIdGet()

Retrieve a single module by its ID

### Example

```typescript
import {
    ModulesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ModulesApi(configuration);

let id: number; //Module ID (default to undefined)

const { status, data } = await apiInstance.modulesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Module ID | defaults to undefined|


### Return type

**Module**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Module details |  -  |
|**400** | Invalid module ID |  -  |
|**404** | Module not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **modulesIdPut**
> Module modulesIdPut(updateModuleInput)

Update an existing module with the specified details

### Example

```typescript
import {
    ModulesApi,
    Configuration,
    UpdateModuleInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ModulesApi(configuration);

let id: number; //Module ID (default to undefined)
let updateModuleInput: UpdateModuleInput; //

const { status, data } = await apiInstance.modulesIdPut(
    id,
    updateModuleInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateModuleInput** | **UpdateModuleInput**|  | |
| **id** | [**number**] | Module ID | defaults to undefined|


### Return type

**Module**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Module updated successfully |  -  |
|**400** | Invalid request payload |  -  |
|**404** | Module not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **modulesPost**
> Module modulesPost(createModuleInput)

Create a new module with specified details

### Example

```typescript
import {
    ModulesApi,
    Configuration,
    CreateModuleInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ModulesApi(configuration);

let createModuleInput: CreateModuleInput; //

const { status, data } = await apiInstance.modulesPost(
    createModuleInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createModuleInput** | **CreateModuleInput**|  | |


### Return type

**Module**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Module created successfully |  -  |
|**400** | Invalid request payload |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

