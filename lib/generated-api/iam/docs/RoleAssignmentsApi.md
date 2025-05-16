# RoleAssignmentsApi

All URIs are relative to *http://localhost:8081/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createRoleAssignment**](#createroleassignment) | **POST** /role-assignments | Create a new role assignment|
|[**getRoleAssignmentsOnPrincipal**](#getroleassignmentsonprincipal) | **GET** /role-assignments/principals/{principal_type}/{principal_id} | Get role assignments for a principal (user or group)|
|[**getRoleAssignmentsOnResource**](#getroleassignmentsonresource) | **GET** /role-assignments/resources/{resource_name} | Get role assignments for a resource|
|[**removeRoleAssignment**](#removeroleassignment) | **DELETE** /role-assignments | Remove a role assignment|

# **createRoleAssignment**
> createRoleAssignment(roleAssignment)


### Example

```typescript
import {
    RoleAssignmentsApi,
    Configuration,
    RoleAssignment
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleAssignmentsApi(configuration);

let roleAssignment: RoleAssignment; //

const { status, data } = await apiInstance.createRoleAssignment(
    roleAssignment
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roleAssignment** | **RoleAssignment**|  | |


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
|**201** | Role assignment created successfully |  -  |
|**400** | Bad request |  -  |
|**404** | Resource not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRoleAssignmentsOnPrincipal**
> Array<RoleAssignment> getRoleAssignmentsOnPrincipal()


### Example

```typescript
import {
    RoleAssignmentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleAssignmentsApi(configuration);

let principalType: 'user' | 'group'; // (default to undefined)
let principalId: string; // (default to undefined)

const { status, data } = await apiInstance.getRoleAssignmentsOnPrincipal(
    principalType,
    principalId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **principalType** | [**&#39;user&#39; | &#39;group&#39;**]**Array<&#39;user&#39; &#124; &#39;group&#39;>** |  | defaults to undefined|
| **principalId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RoleAssignment>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of role assignments for the principal |  -  |
|**404** | Resource not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRoleAssignmentsOnResource**
> Array<RoleAssignment> getRoleAssignmentsOnResource()


### Example

```typescript
import {
    RoleAssignmentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleAssignmentsApi(configuration);

let resourceName: string; // (default to undefined)

const { status, data } = await apiInstance.getRoleAssignmentsOnResource(
    resourceName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resourceName** | [**string**] |  | defaults to undefined|


### Return type

**Array<RoleAssignment>**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of role assignments for the resource |  -  |
|**404** | Resource not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeRoleAssignment**
> removeRoleAssignment(roleAssignment)


### Example

```typescript
import {
    RoleAssignmentsApi,
    Configuration,
    RoleAssignment
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleAssignmentsApi(configuration);

let roleAssignment: RoleAssignment; //

const { status, data } = await apiInstance.removeRoleAssignment(
    roleAssignment
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roleAssignment** | **RoleAssignment**|  | |


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
|**204** | Role assignment removed successfully |  -  |
|**400** | Bad request |  -  |
|**404** | Resource not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

