# TfStateServiceApi

All URIs are relative to *http://localhost:8084/api/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**deleteTfStateByDeploymentId**](#deletetfstatebydeploymentid) | **DELETE** /tfstate/{deploymentId} | Delete Terraform state by deployment ID|
|[**getTfStateByDeploymentId**](#gettfstatebydeploymentid) | **GET** /tfstate/{deploymentId} | Get Terraform state by deployment ID|
|[**storeTfState**](#storetfstate) | **POST** /tfstate/{deploymentId} | Store or update Terraform state by deployment ID|
|[**tfStateExists**](#tfstateexists) | **GET** /tfstate/{deploymentId}/exists | Check if Terraform state exists for a deployment ID|

# **deleteTfStateByDeploymentId**
> deleteTfStateByDeploymentId()


### Example

```typescript
import {
    TfStateServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TfStateServiceApi(configuration);

let deploymentId: number; //ID of the deployment. (default to undefined)

const { status, data } = await apiInstance.deleteTfStateByDeploymentId(
    deploymentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deploymentId** | [**number**] | ID of the deployment. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Terraform state deleted successfully. |  -  |
|**404** | Terraform state not found. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getTfStateByDeploymentId**
> TerraformState getTfStateByDeploymentId()


### Example

```typescript
import {
    TfStateServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TfStateServiceApi(configuration);

let deploymentId: number; //ID of the deployment. (default to undefined)

const { status, data } = await apiInstance.getTfStateByDeploymentId(
    deploymentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deploymentId** | [**number**] | ID of the deployment. | defaults to undefined|


### Return type

**TerraformState**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The Terraform state. |  -  |
|**404** | Terraform state not found. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **storeTfState**
> storeTfState(body)


### Example

```typescript
import {
    TfStateServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TfStateServiceApi(configuration);

let deploymentId: number; //ID of the deployment. (default to undefined)
let body: string; //The Terraform state string.

const { status, data } = await apiInstance.storeTfState(
    deploymentId,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **string**| The Terraform state string. | |
| **deploymentId** | [**number**] | ID of the deployment. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: text/plain
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Terraform state stored successfully. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **tfStateExists**
> TfStateExists200Response tfStateExists()


### Example

```typescript
import {
    TfStateServiceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TfStateServiceApi(configuration);

let deploymentId: number; //ID of the deployment. (default to undefined)

const { status, data } = await apiInstance.tfStateExists(
    deploymentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deploymentId** | [**number**] | ID of the deployment. | defaults to undefined|


### Return type

**TfStateExists200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | State existence status. |  -  |
|**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

