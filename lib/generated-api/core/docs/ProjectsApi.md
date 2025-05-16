# ProjectsApi

All URIs are relative to *http://localhost:8083/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**organizationsOrganizationIdProjectsGet**](#organizationsorganizationidprojectsget) | **GET** /organizations/{organizationId}/projects | Get projects by organization ID|
|[**projectsIdDelete**](#projectsiddelete) | **DELETE** /projects/{id} | Delete a project|
|[**projectsIdGet**](#projectsidget) | **GET** /projects/{id} | Get project by ID|
|[**projectsIdPut**](#projectsidput) | **PUT** /projects/{id} | Update an existing project|
|[**projectsPost**](#projectspost) | **POST** /projects | Create a new project|

# **organizationsOrganizationIdProjectsGet**
> Array<Project> organizationsOrganizationIdProjectsGet()

Retrieve all projects associated with a specific organization

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let organizationId: number; //Organization ID (default to undefined)

const { status, data } = await apiInstance.organizationsOrganizationIdProjectsGet(
    organizationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **organizationId** | [**number**] | Organization ID | defaults to undefined|


### Return type

**Array<Project>**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of projects |  -  |
|**400** | Invalid organization ID |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **projectsIdDelete**
> projectsIdDelete()

Delete a project by its ID

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let id: number; //Project ID (default to undefined)

const { status, data } = await apiInstance.projectsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Project ID | defaults to undefined|


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
|**204** | Project deleted successfully |  -  |
|**400** | Invalid project ID |  -  |
|**404** | Project not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **projectsIdGet**
> Project projectsIdGet()

Retrieve a single project by its ID

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let id: number; //Project ID (default to undefined)

const { status, data } = await apiInstance.projectsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Project ID | defaults to undefined|


### Return type

**Project**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Project details |  -  |
|**400** | Invalid project ID |  -  |
|**404** | Project not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **projectsIdPut**
> Project projectsIdPut(updateProjectInput)

Update the details of an existing project by ID

### Example

```typescript
import {
    ProjectsApi,
    Configuration,
    UpdateProjectInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let id: number; //Project ID (default to undefined)
let updateProjectInput: UpdateProjectInput; //

const { status, data } = await apiInstance.projectsIdPut(
    id,
    updateProjectInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateProjectInput** | **UpdateProjectInput**|  | |
| **id** | [**number**] | Project ID | defaults to undefined|


### Return type

**Project**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Project updated successfully |  -  |
|**400** | Invalid request payload |  -  |
|**404** | Project not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **projectsPost**
> Project projectsPost(createProjectInput)

Create a new project with specified details

### Example

```typescript
import {
    ProjectsApi,
    Configuration,
    CreateProjectInput
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let createProjectInput: CreateProjectInput; //

const { status, data } = await apiInstance.projectsPost(
    createProjectInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createProjectInput** | **CreateProjectInput**|  | |


### Return type

**Project**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Project created successfully |  -  |
|**400** | Invalid request payload |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

