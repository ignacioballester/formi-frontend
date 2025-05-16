# DeploymentsApi

All URIs are relative to *http://localhost:8083/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**deploymentsGet**](#deploymentsget) | **GET** /deployments | Get all deployments|
|[**deploymentsIdDelete**](#deploymentsiddelete) | **DELETE** /deployments/{id} | Destroy a deployment|
|[**deploymentsIdGet**](#deploymentsidget) | **GET** /deployments/{id} | Get deployment by ID and version|
|[**deploymentsIdPatch**](#deploymentsidpatch) | **PATCH** /deployments/{id} | Update a deployment|
|[**deploymentsPost**](#deploymentspost) | **POST** /deployments | Deploy a module|

# **deploymentsGet**
> Array<Deployment> deploymentsGet()

Retrieve a list of deployments, with optional filters for environment ID, project ID, and deployment ID

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let projectId: number; //Project ID (default to undefined)
let id: number; //Deployment ID (optional) (default to undefined)

const { status, data } = await apiInstance.deploymentsGet(
    projectId,
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**number**] | Project ID | defaults to undefined|
| **id** | [**number**] | Deployment ID | (optional) defaults to undefined|


### Return type

**Array<Deployment>**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of deployments |  -  |
|**400** | Invalid project ID |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deploymentsIdDelete**
> DeploymentsIdDelete200Response deploymentsIdDelete()

Destroy an existing deployment by its ID

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let id: number; //Deployment ID (default to undefined)

const { status, data } = await apiInstance.deploymentsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Deployment ID | defaults to undefined|


### Return type

**DeploymentsIdDelete200Response**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Deployment destroyed successfully |  -  |
|**400** | Invalid deployment ID |  -  |
|**404** | Deployment not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deploymentsIdGet**
> Deployment deploymentsIdGet()

Retrieve a specific deployment by its ID and version

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let id: number; //Deployment ID (default to undefined)
let version: number; //Version number (default to undefined)

const { status, data } = await apiInstance.deploymentsIdGet(
    id,
    version
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Deployment ID | defaults to undefined|
| **version** | [**number**] | Version number | defaults to undefined|


### Return type

**Deployment**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Deployment details |  -  |
|**400** | Invalid deployment ID or version |  -  |
|**404** | Deployment not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deploymentsIdPatch**
> DeploymentsPost201Response deploymentsIdPatch(updateDeploymentInput)

Update the details of an existing deployment based on the provided input

### Example

```typescript
import {
    DeploymentsApi,
    Configuration,
    UpdateDeploymentInput
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let id: number; //Deployment ID (default to undefined)
let updateDeploymentInput: UpdateDeploymentInput; //

const { status, data } = await apiInstance.deploymentsIdPatch(
    id,
    updateDeploymentInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateDeploymentInput** | **UpdateDeploymentInput**|  | |
| **id** | [**number**] | Deployment ID | defaults to undefined|


### Return type

**DeploymentsPost201Response**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Deployment updated successfully |  -  |
|**400** | Invalid request payload |  -  |
|**404** | Deployment not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deploymentsPost**
> DeploymentsPost201Response deploymentsPost(deployModuleInput)

Deploy a new module based on the provided input

### Example

```typescript
import {
    DeploymentsApi,
    Configuration,
    DeployModuleInput
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let deployModuleInput: DeployModuleInput; //

const { status, data } = await apiInstance.deploymentsPost(
    deployModuleInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deployModuleInput** | **DeployModuleInput**|  | |


### Return type

**DeploymentsPost201Response**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Deployment created successfully |  -  |
|**400** | Invalid request payload |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

