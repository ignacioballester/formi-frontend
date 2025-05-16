# DefaultApi

All URIs are relative to *http://localhost:8082/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createSecret**](#createsecret) | **POST** /secrets | Create a new secret|
|[**deleteSecret**](#deletesecret) | **DELETE** /secrets/{name} | Delete a secret|
|[**getSecret**](#getsecret) | **GET** /secrets/{name} | Get a specific secret|
|[**listSecretTypes**](#listsecrettypes) | **GET** /secrets/types | List all secret types|
|[**listSecrets**](#listsecrets) | **GET** /secrets | List all secrets|
|[**updateSecret**](#updatesecret) | **PUT** /secrets/{name} | Update a secret|

# **createSecret**
> SecretResponse createSecret(secretCreate)


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    SecretCreate
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let secretCreate: SecretCreate; //

const { status, data } = await apiInstance.createSecret(
    secretCreate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **secretCreate** | **SecretCreate**|  | |


### Return type

**SecretResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Secret created successfully |  -  |
|**400** | Invalid input |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteSecret**
> deleteSecret()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let name: string; // (default to undefined)
let type: string; // (default to undefined)
let organizationId: number; // (optional) (default to undefined)
let projectId: number; // (optional) (default to undefined)

const { status, data } = await apiInstance.deleteSecret(
    name,
    type,
    organizationId,
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **name** | [**string**] |  | defaults to undefined|
| **type** | [**string**] |  | defaults to undefined|
| **organizationId** | [**number**] |  | (optional) defaults to undefined|
| **projectId** | [**number**] |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Secret deleted successfully |  -  |
|**404** | Secret not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSecret**
> SecretResponse getSecret()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let name: string; // (default to undefined)
let type: string; // (default to undefined)
let organizationId: number; // (optional) (default to undefined)
let projectId: number; // (optional) (default to undefined)
let includePrivate: boolean; // (optional) (default to false)

const { status, data } = await apiInstance.getSecret(
    name,
    type,
    organizationId,
    projectId,
    includePrivate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **name** | [**string**] |  | defaults to undefined|
| **type** | [**string**] |  | defaults to undefined|
| **organizationId** | [**number**] |  | (optional) defaults to undefined|
| **projectId** | [**number**] |  | (optional) defaults to undefined|
| **includePrivate** | [**boolean**] |  | (optional) defaults to false|


### Return type

**SecretResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Secret details |  -  |
|**404** | Secret not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listSecretTypes**
> Array<SecretType> listSecretTypes()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.listSecretTypes();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<SecretType>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of secret types |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listSecrets**
> Array<SecretResponse> listSecrets()


### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let organizationId: number; // (optional) (default to undefined)
let projectId: number; // (optional) (default to undefined)
let type: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.listSecrets(
    organizationId,
    projectId,
    type
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **organizationId** | [**number**] |  | (optional) defaults to undefined|
| **projectId** | [**number**] |  | (optional) defaults to undefined|
| **type** | [**string**] |  | (optional) defaults to undefined|


### Return type

**Array<SecretResponse>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of secrets |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateSecret**
> SecretResponse updateSecret(secretUpdate)


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    SecretUpdate
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let name: string; // (default to undefined)
let secretUpdate: SecretUpdate; //

const { status, data } = await apiInstance.updateSecret(
    name,
    secretUpdate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **secretUpdate** | **SecretUpdate**|  | |
| **name** | [**string**] |  | defaults to undefined|


### Return type

**SecretResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Secret updated successfully |  -  |
|**400** | Invalid input |  -  |
|**404** | Secret not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

