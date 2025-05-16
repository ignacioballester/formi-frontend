# RepositoriesApi

All URIs are relative to *http://localhost:8083/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**repositoriesGet**](#repositoriesget) | **GET** /repositories | Get repositories|
|[**repositoriesIdDelete**](#repositoriesiddelete) | **DELETE** /repositories/{id} | Delete a repository|
|[**repositoriesIdGet**](#repositoriesidget) | **GET** /repositories/{id} | Get repository by ID|
|[**repositoriesIdPut**](#repositoriesidput) | **PUT** /repositories/{id} | Update a repository|
|[**repositoriesPost**](#repositoriespost) | **POST** /repositories | Create a new repository|

# **repositoriesGet**
> Array<Repository> repositoriesGet()

Retrieve a list of repositories. Optionally filter by project_id or organization_id query parameters.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let projectId: number; //Project ID (optional) (default to undefined)
let organizationId: number; //Organization ID (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesGet(
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

**Array<Repository>**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of repositories |  -  |
|**400** | Invalid project ID or organization ID |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesIdDelete**
> repositoriesIdDelete()

Delete a repository by its ID.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let id: number; //Repository ID (default to undefined)

const { status, data } = await apiInstance.repositoriesIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Repository ID | defaults to undefined|


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
|**204** | Repository deleted successfully |  -  |
|**400** | Invalid repository ID |  -  |
|**404** | Repository not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesIdGet**
> RepositoryResponse repositoriesIdGet()

Retrieve a single repository by its ID.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let id: number; //Repository ID (default to undefined)

const { status, data } = await apiInstance.repositoriesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Repository ID | defaults to undefined|


### Return type

**RepositoryResponse**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Repository details |  -  |
|**400** | Invalid repository ID |  -  |
|**404** | Repository not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesIdPut**
> Repository repositoriesIdPut(updateRepositoryInput)

Update an existing repository with the specified details

### Example

```typescript
import {
    RepositoriesApi,
    Configuration,
    UpdateRepositoryInput
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let id: number; //Repository ID (default to undefined)
let updateRepositoryInput: UpdateRepositoryInput; //

const { status, data } = await apiInstance.repositoriesIdPut(
    id,
    updateRepositoryInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateRepositoryInput** | **UpdateRepositoryInput**|  | |
| **id** | [**number**] | Repository ID | defaults to undefined|


### Return type

**Repository**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Repository updated successfully |  -  |
|**400** | Invalid request payload |  -  |
|**404** | Repository not found |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesPost**
> Repository repositoriesPost(createRepositoryInput)

Create a new repository with the specified details. The request body should include owner, repo, project_id, and organization_id.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration,
    CreateRepositoryInput
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let createRepositoryInput: CreateRepositoryInput; //

const { status, data } = await apiInstance.repositoriesPost(
    createRepositoryInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createRepositoryInput** | **CreateRepositoryInput**|  | |


### Return type

**Repository**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Repository created successfully |  -  |
|**400** | Invalid request payload |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

