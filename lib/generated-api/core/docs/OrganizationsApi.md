# OrganizationsApi

All URIs are relative to *http://localhost:8083/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**orgsGet**](#orgsget) | **GET** /orgs | Get all organizations|
|[**orgsIdDelete**](#orgsiddelete) | **DELETE** /orgs/{id} | Delete an organization|
|[**orgsIdGet**](#orgsidget) | **GET** /orgs/{id} | Get an organization by ID|
|[**orgsIdPut**](#orgsidput) | **PUT** /orgs/{id} | Update an organization|
|[**orgsPost**](#orgspost) | **POST** /orgs | Create a new organization|

# **orgsGet**
> Array<Organization> orgsGet()

Retrieve a list of all organizations

### Example

```typescript
import {
    OrganizationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OrganizationsApi(configuration);

const { status, data } = await apiInstance.orgsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Organization>**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of organizations |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **orgsIdDelete**
> orgsIdDelete()

Remove an organization by its ID

### Example

```typescript
import {
    OrganizationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OrganizationsApi(configuration);

let id: number; //Organization ID (default to undefined)

const { status, data } = await apiInstance.orgsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Organization ID | defaults to undefined|


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
|**204** | Organization deleted successfully |  -  |
|**400** | Invalid organization ID |  -  |
|**404** | Organization not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **orgsIdGet**
> Organization orgsIdGet()

Retrieve an organization by its ID

### Example

```typescript
import {
    OrganizationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OrganizationsApi(configuration);

let id: number; //Organization ID (default to undefined)

const { status, data } = await apiInstance.orgsIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | Organization ID | defaults to undefined|


### Return type

**Organization**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Organization details |  -  |
|**400** | Invalid organization ID |  -  |
|**404** | Organization not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **orgsIdPut**
> Organization orgsIdPut(updateOrganizationInput)

Update an organization\'s details by ID

### Example

```typescript
import {
    OrganizationsApi,
    Configuration,
    UpdateOrganizationInput
} from './api';

const configuration = new Configuration();
const apiInstance = new OrganizationsApi(configuration);

let id: number; //Organization ID (default to undefined)
let updateOrganizationInput: UpdateOrganizationInput; //

const { status, data } = await apiInstance.orgsIdPut(
    id,
    updateOrganizationInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateOrganizationInput** | **UpdateOrganizationInput**|  | |
| **id** | [**number**] | Organization ID | defaults to undefined|


### Return type

**Organization**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Organization updated successfully |  -  |
|**400** | Invalid request payload |  -  |
|**404** | Organization not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **orgsPost**
> Organization orgsPost(createOrganizationInput)

Add a new organization with name and description

### Example

```typescript
import {
    OrganizationsApi,
    Configuration,
    CreateOrganizationInput
} from './api';

const configuration = new Configuration();
const apiInstance = new OrganizationsApi(configuration);

let createOrganizationInput: CreateOrganizationInput; //

const { status, data } = await apiInstance.orgsPost(
    createOrganizationInput
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createOrganizationInput** | **CreateOrganizationInput**|  | |


### Return type

**Organization**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Organization created successfully |  -  |
|**400** | Invalid request payload |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

